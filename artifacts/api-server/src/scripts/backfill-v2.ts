/**
 * Legacy → v2 backfill (strangler-fig, docs/plans/phase-1-schema-v2.md
 * §Legacy mapping). Idempotent: safe to run repeatedly; already-migrated rows
 * are recognized by metadata.legacy_*_id and skipped, edges/stars top up via
 * ON CONFLICT DO NOTHING. Legacy tables are never written.
 *
 * Run: pnpm --filter @workspace/api-server run backfill:v2
 */
import { and, eq, isNull, sql } from "drizzle-orm";
import {
  assetEdges,
  assetKinds,
  assetResults,
  assets,
  assetVersions,
  collections,
  events,
  principals,
  promptFavorites,
  promptLikes,
  prompts,
  stars,
  isLicenseCode,
  normalizeLicense,
  type Asset,
} from "@workspace/db";
import { db, pool } from "../db";
import { base58, computeContentHash, newAssetPublicId, slugify } from "../v2/ids";

// Legacy prompt_type values that map onto a v2 kind; everything else lands as
// a plain prompt and keeps its original type in metadata.
const KIND_BY_LEGACY_TYPE: Record<string, string> = {
  skill: "skill",
  rule: "rule",
  command: "command",
  "system prompt": "system_prompt",
  system_prompt: "system_prompt",
  "mcp server": "mcp-server",
  "mcp-server": "mcp-server",
};

function compact(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([, v]) =>
        v !== null &&
        v !== undefined &&
        v !== "" &&
        !(Array.isArray(v) && v.length === 0),
    ),
  );
}

async function main() {
  const summary = {
    principalsTotal: 0,
    promptsCreated: 0,
    promptsSkippedExisting: 0,
    forksLinked: 0,
    collectionsCreated: 0,
    collectionsSkippedNoOwner: 0,
    edgesInserted: 0,
    starsInserted: 0,
  };

  // -- 1. principals 1:1 from users --------------------------------------
  await db.execute(sql`
    INSERT INTO principals (kind, user_id)
    SELECT 'user', id FROM users
    ON CONFLICT (user_id) DO NOTHING
  `);
  const principalByUser = new Map<string, string>();
  for (const p of await db.select().from(principals)) {
    if (p.userId) principalByUser.set(p.userId, p.id);
  }
  summary.principalsTotal = principalByUser.size;

  // -- idempotency + slug state from existing v2 rows ---------------------
  const assetByLegacyPrompt = new Map<string, Asset>();
  const assetByLegacyCollection = new Map<string, Asset>();
  const slugsByOwner = new Map<string, Set<string>>();
  for (const a of await db.select().from(assets)) {
    const meta = (a.metadata ?? {}) as Record<string, unknown>;
    if (typeof meta["legacy_prompt_id"] === "string") {
      assetByLegacyPrompt.set(meta["legacy_prompt_id"], a);
    }
    if (typeof meta["legacy_collection_id"] === "string") {
      assetByLegacyCollection.set(meta["legacy_collection_id"], a);
    }
    let owned = slugsByOwner.get(a.ownerId);
    if (!owned) slugsByOwner.set(a.ownerId, (owned = new Set()));
    owned.add(a.slug);
  }

  const claimSlug = (ownerId: string, name: string): string => {
    let owned = slugsByOwner.get(ownerId);
    if (!owned) slugsByOwner.set(ownerId, (owned = new Set()));
    const base = slugify(name) || "asset";
    let candidate = base;
    for (let i = 2; owned.has(candidate); i++) {
      candidate = i <= 50 ? `${base}-${i}` : `${base}-${base58(6).toLowerCase()}`;
    }
    owned.add(candidate);
    return candidate;
  };

  const activeKinds = new Set(
    (await db.select().from(assetKinds))
      .filter((k) => k.isActive)
      .map((k) => k.id),
  );

  // -- 2. prompts → assets (kind by type) + version 1 + image results -----
  const allPrompts = await db.select().from(prompts);
  for (const p of allPrompts) {
    if (assetByLegacyPrompt.has(p.id)) {
      summary.promptsSkippedExisting++;
      continue;
    }
    const ownerId = principalByUser.get(p.userId);
    if (!ownerId) continue; // FK guarantees this shouldn't happen

    const mappedKind = KIND_BY_LEGACY_TYPE[(p.promptType ?? "").toLowerCase()];
    const kindId = mappedKind && activeKinds.has(mappedKind) ? mappedKind : "prompt";
    const visibility = p.isPublic && !p.isHidden ? "public" : "private";
    const metadata = compact({
      legacy_prompt_id: p.id,
      // pre-plan-31 rows may still hold display strings; keep the original
      legacy_license: p.license && !isLicenseCode(p.license) ? p.license : undefined,
      negative_prompt: p.negativePrompt,
      category: p.category,
      categories: p.categories,
      prompt_type: p.promptType,
      prompt_types: p.promptTypes,
      prompt_style: p.promptStyle,
      prompt_styles: p.promptStyles,
      intended_generator: p.intendedGenerator,
      intended_generators: p.intendedGenerators,
      recommended_models: p.recommendedModels,
      technical_params: p.technicalParams,
      variables: p.variables,
      notes: p.notes,
      author: p.author,
      source_url: p.sourceUrl,
      use_case: p.useCase,
      difficulty_level: p.difficultyLevel,
      style_keywords: p.styleKeywords,
      intended_recipient: p.intendedRecipient,
      specific_service: p.specificService,
      is_nsfw: p.isNsfw ? true : undefined,
      legacy_status: p.status,
      usage_count: p.usageCount || undefined,
    });

    await db.transaction(async (tx) => {
      const [asset] = await tx
        .insert(assets)
        .values({
          publicId: newAssetPublicId(),
          kindId,
          ownerId,
          name: p.name,
          slug: claimSlug(ownerId, p.name),
          description: p.description,
          visibility,
          license: normalizeLicense(p.license),
          tags: p.tags ?? [],
          metadata,
          createdAt: p.createdAt ?? undefined,
          updatedAt: p.updatedAt ?? undefined,
        })
        .returning();
      const [version] = await tx
        .insert(assetVersions)
        .values({
          assetId: asset!.id,
          versionNumber: 1,
          changelog: "Imported from legacy prompt library",
          contentText: p.promptContent,
          contentHash: computeContentHash(p.promptContent, null),
          createdBy: ownerId,
          createdAt: p.createdAt ?? undefined,
        })
        .returning();
      await tx
        .update(assets)
        .set({ headVersionId: version!.id })
        .where(eq(assets.id, asset!.id));

      for (const [i, url] of (p.exampleImagesUrl ?? []).entries()) {
        if (!url) continue;
        await tx.insert(assetResults).values({
          assetId: asset!.id,
          assetVersionId: version!.id,
          createdBy: ownerId,
          mediaType: "image",
          url,
          metadata: { backfill: true, position: i },
        });
      }

      await tx.insert(events).values({
        actorId: ownerId,
        verb: "asset.created",
        objectType: "asset",
        objectId: asset!.id,
        context: { backfill: true, legacyPromptId: p.id },
        createdAt: p.createdAt ?? undefined,
      });
      assetByLegacyPrompt.set(p.id, asset!);
    });
    summary.promptsCreated++;
  }

  // -- 3. branch_of → fork lineage (second pass: parents now all exist) ---
  for (const p of allPrompts) {
    if (!p.branchOf) continue;
    const child = assetByLegacyPrompt.get(p.id);
    const parent = assetByLegacyPrompt.get(p.branchOf);
    if (!child || !parent || child.forkedFromAssetId) continue;
    await db
      .update(assets)
      .set({ forkedFromAssetId: parent.id })
      .where(and(eq(assets.id, child.id), isNull(assets.forkedFromAssetId)));
    summary.forksLinked++;
  }
  await db.execute(sql`
    UPDATE assets a SET fork_count = c.n
    FROM (
      SELECT forked_from_asset_id AS id, count(*) AS n
      FROM assets WHERE forked_from_asset_id IS NOT NULL
      GROUP BY 1
    ) c
    WHERE c.id = a.id AND a.fork_count <> c.n
  `);

  // -- 4. collections → stacks; membership → edges (float to head) --------
  const allCollections = await db.select().from(collections);
  for (const c of allCollections) {
    if (assetByLegacyCollection.has(c.id)) continue;
    const ownerId = c.userId ? principalByUser.get(c.userId) : undefined;
    if (!ownerId) {
      // community/global collections wait for org principals (later phase)
      summary.collectionsSkippedNoOwner++;
      continue;
    }
    await db.transaction(async (tx) => {
      const [stack] = await tx
        .insert(assets)
        .values({
          publicId: newAssetPublicId(),
          kindId: "stack",
          ownerId,
          name: c.name,
          slug: claimSlug(ownerId, c.name),
          description: c.description,
          visibility: c.isPublic ? "public" : "private",
          license: normalizeLicense(null),
          metadata: { legacy_collection_id: c.id },
          createdAt: c.createdAt ?? undefined,
          updatedAt: c.updatedAt ?? undefined,
        })
        .returning();
      await tx.insert(events).values({
        actorId: ownerId,
        verb: "asset.created",
        objectType: "asset",
        objectId: stack!.id,
        context: { backfill: true, legacyCollectionId: c.id },
        createdAt: c.createdAt ?? undefined,
      });
      assetByLegacyCollection.set(c.id, stack!);
    });
    summary.collectionsCreated++;
  }

  // membership comes from both prompts.collection_id and collection_ids[]
  const membersByCollection = new Map<
    string,
    Array<{ promptId: string; createdAt: Date | null }>
  >();
  for (const p of allPrompts) {
    const ids = new Set<string>(p.collectionIds ?? []);
    if (p.collectionId) ids.add(p.collectionId);
    for (const cid of ids) {
      let members = membersByCollection.get(cid);
      if (!members) membersByCollection.set(cid, (members = []));
      members.push({ promptId: p.id, createdAt: p.createdAt });
    }
  }
  for (const [collectionId, members] of membersByCollection) {
    const stack = assetByLegacyCollection.get(collectionId);
    if (!stack) continue;
    members.sort(
      (a, b) => (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0),
    );
    for (const [position, member] of members.entries()) {
      const child = assetByLegacyPrompt.get(member.promptId);
      if (!child) continue;
      const inserted = await db
        .insert(assetEdges)
        .values({
          parentAssetId: stack.id,
          childAssetId: child.id,
          role: "item",
          position,
          pinnedVersionId: null, // float to head: folders feel live (decision #1)
        })
        .onConflictDoNothing()
        .returning({ id: assetEdges.id });
      if (inserted.length > 0) summary.edgesInserted++;
    }
  }

  // -- 5. likes + favorites → stars (deduped union, earliest timestamp) ---
  const wanted = new Map<
    string,
    { principalId: string; assetId: string; createdAt: Date | null }
  >();
  const likeRows = await db.select().from(promptLikes);
  const favoriteRows = await db.select().from(promptFavorites);
  for (const r of [...likeRows, ...favoriteRows]) {
    const principalId = principalByUser.get(r.userId);
    const asset = assetByLegacyPrompt.get(r.promptId);
    if (!principalId || !asset) continue;
    const key = `${principalId}:${asset.id}`;
    const existing = wanted.get(key);
    if (
      !existing ||
      (r.createdAt &&
        (!existing.createdAt || r.createdAt < existing.createdAt))
    ) {
      wanted.set(key, { principalId, assetId: asset.id, createdAt: r.createdAt });
    }
  }
  for (const s of wanted.values()) {
    const inserted = await db
      .insert(stars)
      .values({
        principalId: s.principalId,
        assetId: s.assetId,
        createdAt: s.createdAt ?? undefined,
      })
      .onConflictDoNothing()
      .returning({ assetId: stars.assetId });
    if (inserted.length > 0) {
      summary.starsInserted++;
      await db.insert(events).values({
        actorId: s.principalId,
        verb: "star.added",
        objectType: "asset",
        objectId: s.assetId,
        context: { backfill: true },
        createdAt: s.createdAt ?? undefined,
      });
    }
  }
  await db.execute(sql`
    UPDATE assets a SET star_count = c.n
    FROM (SELECT asset_id, count(*) AS n FROM stars GROUP BY 1) c
    WHERE c.asset_id = a.id AND a.star_count <> c.n
  `);

  console.log("Backfill complete:", summary);
}

main()
  .then(() => pool.end())
  .catch((err) => {
    console.error("Backfill failed:", err);
    return pool.end().finally(() => process.exit(1));
  });
