/**
 * Seed corpus importer — reads data/seed/assets-*.jsonl and upserts into the
 * v2 asset tables.
 *
 * Identity: assets are matched by metadata.source.repo + metadata.source.path.
 *   - Same repo+path, same provenance.content_hash → no-op.
 *   - Same repo+path, different content_hash → new immutable version (head moves).
 *   - New repo+path → new asset + version 1.
 *
 * Owner: a singleton "curation" principal (kind='curation', user_id null),
 * looked up or created at startup.
 *
 * ⚠ INLINE-BUNDLE DEVIATION: JSONL content_files entries are {path, text}
 * (inline text). The v2 schema's ContentFile type (store.ts) expects GCS
 * manifests ({path, storageKey, size, sha256}). This importer stores the
 * inline form directly in the contentFiles jsonb column, bypassing the GCS
 * upload step. The Steward must ratify inline-text bundles as a supported fast
 * path or mandate a GCS upload step before this can be considered production-
 * complete for bundle kinds.
 *
 * Run: pnpm --filter @workspace/api-server run import:seed
 */
import { createReadStream } from "node:fs";
import { readdir } from "node:fs/promises";
import { createInterface } from "node:readline";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { eq, sql } from "drizzle-orm";
import {
  assets,
  assetKinds,
  assetVersions,
  events,
  principals,
  isLicenseCode,
  type LicenseCode,
} from "@workspace/db";
import { db, pool } from "../db";
import { computeContentHash, newAssetPublicId, slugify, base58 } from "../v2/ids";

// ---------------------------------------------------------------------------
// Path resolution: compiled to dist/scripts/ → go up 4 levels to workspace root
// ---------------------------------------------------------------------------
const __dirname = dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = resolve(__dirname, "../../../..");
const SEED_DIR = resolve(WORKSPACE_ROOT, "data/seed");

// ---------------------------------------------------------------------------
// JSONL schema types
// ---------------------------------------------------------------------------

interface SeedProvenance {
  source_url: string;
  repo: string;
  path: string;
  commit_sha: string;
  upstream_license: string;
  fetched_at: string;
  attribution?: string;
  content_hash?: string;
}

interface SeedContentFile {
  path: string;
  text: string;
}

interface SeedRecord {
  kind: string;
  name: string;
  description: string;
  tags: string[];
  license: string;
  content_text?: string;
  content_files?: SeedContentFile[];
  provenance: SeedProvenance;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function claimSlug(
  ownerId: string,
  name: string,
  slugsByOwner: Map<string, Set<string>>,
): string {
  let owned = slugsByOwner.get(ownerId);
  if (!owned) slugsByOwner.set(ownerId, (owned = new Set()));
  const base = slugify(name) || "asset";
  let candidate = base;
  for (let i = 2; owned.has(candidate); i++) {
    candidate = i <= 50 ? `${base}-${i}` : `${base}-${base58(6).toLowerCase()}`;
  }
  owned.add(candidate);
  return candidate;
}

async function readJsonlFile(filePath: string): Promise<SeedRecord[]> {
  const records: SeedRecord[] = [];
  const rl = createInterface({
    input: createReadStream(filePath),
    crlfDelay: Infinity,
  });
  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    records.push(JSON.parse(trimmed) as SeedRecord);
  }
  return records;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const summary = {
    created: 0,
    updated: 0,
    noop: 0,
    skippedInvalidKind: 0,
    skippedInvalidLicense: 0,
  };

  // -- 1. Discover JSONL files ---------------------------------------------
  const allFiles = await readdir(SEED_DIR);
  const jsonlFiles = allFiles
    .filter((f) => f.startsWith("assets-") && f.endsWith(".jsonl"))
    .sort()
    .map((f) => resolve(SEED_DIR, f));

  if (jsonlFiles.length === 0) {
    console.log(`No assets-*.jsonl files found in ${SEED_DIR}. Nothing to import.`);
    return;
  }
  console.log(`Found ${jsonlFiles.length} JSONL file(s):`, jsonlFiles.map((f) => f.split("/").pop()));

  // -- 2. Curation principal (singleton, lazy-create) ----------------------
  const [existingCuration] = await db
    .select()
    .from(principals)
    .where(eq(principals.kind, "curation"))
    .limit(1);

  let curationId: string;
  if (existingCuration) {
    curationId = existingCuration.id;
    console.log(`Using curation principal: ${curationId}`);
  } else {
    const [created] = await db
      .insert(principals)
      .values({ kind: "curation", userId: null })
      .returning();
    curationId = created!.id;
    console.log(`Created curation principal: ${curationId}`);
  }

  // -- 3. Active kinds gate ------------------------------------------------
  const activeKinds = new Set(
    (await db.select().from(assetKinds))
      .filter((k) => k.isActive)
      .map((k) => k.id),
  );

  // -- 4. Load existing curation assets for idempotency --------------------
  // Identity key: "repo::path" from metadata.source
  const assetBySource = new Map<string, typeof assets.$inferSelect>();
  const slugsByOwner = new Map<string, Set<string>>();
  const ownedSlugs = new Set<string>();

  const existingAssets = await db
    .select()
    .from(assets)
    .where(eq(assets.ownerId, curationId));

  for (const a of existingAssets) {
    ownedSlugs.add(a.slug);
    const src = ((a.metadata ?? {}) as Record<string, unknown>)["source"] as
      | Record<string, unknown>
      | undefined;
    if (typeof src?.["repo"] === "string" && typeof src?.["path"] === "string") {
      assetBySource.set(`${src["repo"]}::${src["path"]}`, a);
    }
  }
  slugsByOwner.set(curationId, ownedSlugs);

  // -- 5. Process all JSONL records ----------------------------------------
  for (const filePath of jsonlFiles) {
    console.log(`\nProcessing ${filePath.split("/").pop()}...`);
    const records = await readJsonlFile(filePath);
    console.log(`  ${records.length} record(s) found`);

    for (const record of records) {
      // Kind gate
      if (!activeKinds.has(record.kind)) {
        console.warn(`  [SKIP] "${record.name}": unknown kind "${record.kind}"`);
        summary.skippedInvalidKind++;
        continue;
      }

      // License gate
      if (!isLicenseCode(record.license)) {
        console.warn(`  [SKIP] "${record.name}": invalid license code "${record.license}"`);
        summary.skippedInvalidLicense++;
        continue;
      }

      const sourceKey = `${record.provenance.repo}::${record.provenance.path}`;
      const existing = assetBySource.get(sourceKey);

      if (existing) {
        // Identity match — check provenance.content_hash for changes
        const storedSrc = ((existing.metadata ?? {}) as Record<string, unknown>)[
          "source"
        ] as Record<string, unknown> | undefined;
        const storedHash = storedSrc?.["content_hash"] as string | undefined;
        const incomingHash = record.provenance.content_hash;

        if (storedHash && incomingHash && storedHash === incomingHash) {
          summary.noop++;
          continue; // true no-op
        }

        // Content changed (or hash missing) → new immutable version
        const newContentHash = computeContentHash(
          record.content_text ?? null,
          record.content_files ?? null,
        );

        await db.transaction(async (tx) => {
          // FOR UPDATE to serialize version numbers (mirrors store.ts createVersion)
          await tx.execute(sql`SELECT id FROM assets WHERE id = ${existing.id} FOR UPDATE`);
          const [maxRow] = await tx
            .select({ max: sql<number>`coalesce(max(${assetVersions.versionNumber}), 0)` })
            .from(assetVersions)
            .where(eq(assetVersions.assetId, existing.id));

          const [version] = await tx
            .insert(assetVersions)
            .values({
              assetId: existing.id,
              versionNumber: (maxRow?.max ?? 0) + 1,
              changelog: `Upstream update ${record.provenance.commit_sha.slice(0, 8)}`,
              contentText: record.content_text ?? null,
              contentFiles: record.content_files ?? null,
              contentHash: newContentHash,
              createdBy: curationId,
            })
            .returning();

          const updatedMeta: Record<string, unknown> = {
            ...((existing.metadata ?? {}) as Record<string, unknown>),
            source: buildSourceMeta(record.provenance),
          };

          await tx
            .update(assets)
            .set({
              headVersionId: version!.id,
              updatedAt: new Date(),
              license: record.license as LicenseCode,
              tags: record.tags,
              description: record.description,
              metadata: updatedMeta,
            })
            .where(eq(assets.id, existing.id));

          await tx.insert(events).values({
            actorId: curationId,
            verb: "version.created",
            objectType: "asset_version",
            objectId: version!.id,
            context: {
              import: true,
              assetId: existing.id,
              versionNumber: version!.versionNumber,
              commitSha: record.provenance.commit_sha,
            },
          });
        });

        // Update local cache so subsequent iterations see the new version
        assetBySource.set(sourceKey, { ...existing });
        summary.updated++;
        console.log(`  [UPDATE] "${record.name}" → new version`);
      } else {
        // New asset
        const newContentHash = computeContentHash(
          record.content_text ?? null,
          record.content_files ?? null,
        );

        await db.transaction(async (tx) => {
          const slug = claimSlug(curationId, record.name, slugsByOwner);

          const [asset] = await tx
            .insert(assets)
            .values({
              publicId: newAssetPublicId(),
              kindId: record.kind,
              ownerId: curationId,
              name: record.name,
              slug,
              description: record.description,
              visibility: "public",
              license: record.license as LicenseCode,
              tags: record.tags,
              metadata: { source: buildSourceMeta(record.provenance) },
            })
            .returning();

          const [version] = await tx
            .insert(assetVersions)
            .values({
              assetId: asset!.id,
              versionNumber: 1,
              changelog: "Initial import from seed corpus",
              contentText: record.content_text ?? null,
              contentFiles: record.content_files ?? null,
              contentHash: newContentHash,
              createdBy: curationId,
            })
            .returning();

          await tx
            .update(assets)
            .set({ headVersionId: version!.id })
            .where(eq(assets.id, asset!.id));

          await tx.insert(events).values({
            actorId: curationId,
            verb: "asset.created",
            objectType: "asset",
            objectId: asset!.id,
            context: { import: true, kindId: record.kind },
          });

          assetBySource.set(sourceKey, { ...asset!, headVersionId: version!.id });
        });

        summary.created++;
        console.log(`  [CREATE] "${record.name}" (${record.kind})`);
      }
    }
  }

  console.log("\n── Import complete ─────────────────────────────────────────");
  console.log(summary);
}

function buildSourceMeta(prov: SeedProvenance): Record<string, unknown> {
  const meta: Record<string, unknown> = {
    repo: prov.repo,
    path: prov.path,
    commit_sha: prov.commit_sha,
    upstream_license: prov.upstream_license,
    fetched_at: prov.fetched_at,
    source_url: prov.source_url,
  };
  if (prov.content_hash) meta["content_hash"] = prov.content_hash;
  if (prov.attribution) meta["attribution"] = prov.attribution;
  return meta;
}

main()
  .then(() => pool.end())
  .catch((err) => {
    console.error("import-seed failed:", err);
    return pool.end().finally(() => process.exit(1));
  });
