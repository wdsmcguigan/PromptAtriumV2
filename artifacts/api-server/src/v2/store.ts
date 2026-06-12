import { and, desc, eq, ilike, isNull, sql } from "drizzle-orm";
import {
  apiTokens,
  assetEdges,
  assetKinds,
  assets,
  assetVersions,
  events,
  principals,
  stars,
  DEFAULT_LICENSE,
  type LicenseCode,
  type Asset,
  type AssetEdge,
  type AssetVersion,
  type InsertEvent,
} from "@workspace/db";
import { db } from "../db";
import {
  base58,
  computeContentHash,
  newAssetPublicId,
  newPatToken,
  hashToken,
  slugify,
} from "./ids";

// Subset of the drizzle client shared by the db handle and a transaction, so
// helpers can run inside or outside a transaction.
type DbConn = Pick<typeof db, "select" | "insert" | "update" | "delete" | "execute">;

export class StoreError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "StoreError";
  }
}

async function emit(conn: DbConn, event: InsertEvent): Promise<void> {
  await conn.insert(events).values(event);
}

export interface ContentFile {
  path: string;
  storageKey: string;
  size: number;
  sha256: string;
}

export interface ContentInput {
  text?: string | undefined;
  files?: ContentFile[] | undefined;
}

// ---------------------------------------------------------------------------
// Kinds
// ---------------------------------------------------------------------------

export async function listKinds() {
  return db.select().from(assetKinds).where(eq(assetKinds.isActive, true));
}

// ---------------------------------------------------------------------------
// Assets
// ---------------------------------------------------------------------------

export async function getAssetByPublicId(
  publicId: string,
): Promise<Asset | undefined> {
  const [asset] = await db
    .select()
    .from(assets)
    .where(eq(assets.publicId, publicId));
  return asset;
}

// Resolve an asset by its public address `handle/slug` (Phase 2 seam #1).
// Used for MCP `asset://{handle}/{slug}` reads; readability is enforced by the
// caller via canRead (404, not 403, for invisible assets).
export async function getAssetByHandleAndSlug(
  handle: string,
  slug: string,
): Promise<Asset | undefined> {
  const [row] = await db
    .select({ asset: assets })
    .from(assets)
    .innerJoin(principals, eq(assets.ownerId, principals.id))
    .where(and(eq(principals.handle, handle), eq(assets.slug, slug)));
  return row?.asset;
}

// The owner handle for an asset — the `{handle}` half of its public address.
export async function getOwnerHandle(
  ownerId: string,
): Promise<string | undefined> {
  const [row] = await db
    .select({ handle: principals.handle })
    .from(principals)
    .where(eq(principals.id, ownerId));
  return row?.handle;
}

export function canRead(asset: Asset, principalId: string): boolean {
  if (asset.ownerId === principalId) return true;
  if (asset.archivedAt) return false;
  return asset.visibility === "public" || asset.visibility === "unlisted";
}

async function uniqueSlug(
  conn: DbConn,
  ownerId: string,
  name: string,
): Promise<string> {
  const base = slugify(name) || "asset";
  const rows = await conn
    .select({ slug: assets.slug })
    .from(assets)
    .where(and(eq(assets.ownerId, ownerId), ilike(assets.slug, `${base}%`)));
  const taken = new Set(rows.map((r) => r.slug));
  if (!taken.has(base)) return base;
  for (let i = 2; i <= 50; i++) {
    if (!taken.has(`${base}-${i}`)) return `${base}-${i}`;
  }
  return `${base}-${base58(6).toLowerCase()}`;
}

export interface CreateAssetInput {
  kindId: string;
  name: string;
  description?: string | undefined;
  visibility?: "private" | "unlisted" | "public" | undefined;
  license?: LicenseCode | undefined;
  tags?: string[] | undefined;
  metadata?: Record<string, unknown> | undefined;
  content?: ContentInput | undefined;
  changelog?: string | undefined;
}

export async function createAsset(
  ownerId: string,
  input: CreateAssetInput,
): Promise<{ asset: Asset; version: AssetVersion | undefined }> {
  const [kind] = await db
    .select()
    .from(assetKinds)
    .where(eq(assetKinds.id, input.kindId));
  if (!kind || !kind.isActive) {
    throw new StoreError(400, `Unknown asset kind: ${input.kindId}`);
  }

  return db.transaction(async (tx) => {
    const slug = await uniqueSlug(tx, ownerId, input.name);
    const [asset] = await tx
      .insert(assets)
      .values({
        publicId: newAssetPublicId(),
        kindId: input.kindId,
        ownerId,
        name: input.name,
        slug,
        description: input.description ?? null,
        visibility: input.visibility ?? "private",
        license: input.license ?? DEFAULT_LICENSE,
        tags: input.tags ?? [],
        metadata: input.metadata ?? {},
      })
      .returning();

    let version: AssetVersion | undefined;
    if (input.content) {
      version = await insertVersion(
        tx,
        asset!,
        1,
        ownerId,
        input.content,
        input.changelog,
      );
    }

    await emit(tx, {
      actorId: ownerId,
      verb: "asset.created",
      objectType: "asset",
      objectId: asset!.id,
      context: { kindId: input.kindId },
    });
    if (asset!.visibility === "public") {
      await emit(tx, {
        actorId: ownerId,
        verb: "asset.published",
        objectType: "asset",
        objectId: asset!.id,
      });
    }
    return { asset: asset!, version };
  });
}

export interface ListAssetsFilters {
  kindId?: string | undefined;
  visibility?: "private" | "unlisted" | "public" | undefined;
  q?: string | undefined;
  includeArchived?: boolean | undefined;
  limit: number;
  offset: number;
}

export async function listAssets(ownerId: string, filters: ListAssetsFilters) {
  const conds = [eq(assets.ownerId, ownerId)];
  if (filters.kindId) conds.push(eq(assets.kindId, filters.kindId));
  if (filters.visibility) conds.push(eq(assets.visibility, filters.visibility));
  if (filters.q) {
    const escaped = filters.q.replace(/[\\%_]/g, (c) => `\\${c}`);
    conds.push(ilike(assets.name, `%${escaped}%`));
  }
  if (!filters.includeArchived) conds.push(isNull(assets.archivedAt));

  return db
    .select()
    .from(assets)
    .where(and(...conds))
    .orderBy(desc(assets.updatedAt))
    .limit(filters.limit)
    .offset(filters.offset);
}

export interface UpdateAssetInput {
  name?: string | undefined;
  description?: string | null | undefined;
  visibility?: "private" | "unlisted" | "public" | undefined;
  license?: LicenseCode | null | undefined;
  tags?: string[] | undefined;
  metadata?: Record<string, unknown> | undefined;
}

export async function updateAsset(
  asset: Asset,
  actorId: string,
  input: UpdateAssetInput,
): Promise<Asset> {
  return db.transaction(async (tx) => {
    // Slug stays stable on rename: it is part of shared URLs.
    const patch: Partial<typeof assets.$inferInsert> = { updatedAt: new Date() };
    if (input.name !== undefined) patch.name = input.name;
    if (input.description !== undefined) patch.description = input.description;
    if (input.visibility !== undefined) patch.visibility = input.visibility;
    if (input.license !== undefined) patch.license = input.license;
    if (input.tags !== undefined) patch.tags = input.tags;
    if (input.metadata !== undefined) patch.metadata = input.metadata;

    const [updated] = await tx
      .update(assets)
      .set(patch)
      .where(eq(assets.id, asset.id))
      .returning();

    await emit(tx, {
      actorId,
      verb: "asset.updated",
      objectType: "asset",
      objectId: asset.id,
      context: { fields: Object.keys(input) },
    });
    if (input.visibility === "public" && asset.visibility !== "public") {
      await emit(tx, {
        actorId,
        verb: "asset.published",
        objectType: "asset",
        objectId: asset.id,
      });
    }
    return updated!;
  });
}

export async function archiveAsset(asset: Asset, actorId: string): Promise<void> {
  if (asset.archivedAt) return;
  await db.transaction(async (tx) => {
    await tx
      .update(assets)
      .set({ archivedAt: new Date(), updatedAt: new Date() })
      .where(eq(assets.id, asset.id));
    await emit(tx, {
      actorId,
      verb: "asset.archived",
      objectType: "asset",
      objectId: asset.id,
    });
  });
}

// ---------------------------------------------------------------------------
// Versions (immutable rings — insert-only, head pointer moves forward)
// ---------------------------------------------------------------------------

async function insertVersion(
  conn: DbConn,
  asset: Asset,
  versionNumber: number,
  createdBy: string,
  content: ContentInput,
  changelog?: string | undefined,
): Promise<AssetVersion> {
  const [version] = await conn
    .insert(assetVersions)
    .values({
      assetId: asset.id,
      versionNumber,
      changelog: changelog ?? null,
      contentText: content.text ?? null,
      contentFiles: content.files ?? null,
      contentHash: computeContentHash(content.text, content.files),
      createdBy,
    })
    .returning();
  await conn
    .update(assets)
    .set({ headVersionId: version!.id, updatedAt: new Date() })
    .where(eq(assets.id, asset.id));
  await emit(conn, {
    actorId: createdBy,
    verb: "version.created",
    objectType: "asset_version",
    objectId: version!.id,
    context: { assetId: asset.id, versionNumber },
  });
  return version!;
}

export async function createVersion(
  asset: Asset,
  createdBy: string,
  content: ContentInput,
  changelog?: string | undefined,
): Promise<AssetVersion> {
  return db.transaction(async (tx) => {
    // Serialize per asset so version numbers stay monotonic under concurrency.
    await tx.execute(sql`SELECT id FROM assets WHERE id = ${asset.id} FOR UPDATE`);
    const [row] = await tx
      .select({
        max: sql<number>`coalesce(max(${assetVersions.versionNumber}), 0)`,
      })
      .from(assetVersions)
      .where(eq(assetVersions.assetId, asset.id));
    return insertVersion(tx, asset, (row?.max ?? 0) + 1, createdBy, content, changelog);
  });
}

export async function listVersions(assetId: string): Promise<AssetVersion[]> {
  return db
    .select()
    .from(assetVersions)
    .where(eq(assetVersions.assetId, assetId))
    .orderBy(desc(assetVersions.versionNumber));
}

export async function getVersion(
  assetId: string,
  versionNumber: number,
): Promise<AssetVersion | undefined> {
  const [version] = await db
    .select()
    .from(assetVersions)
    .where(
      and(
        eq(assetVersions.assetId, assetId),
        eq(assetVersions.versionNumber, versionNumber),
      ),
    );
  return version;
}

export async function getVersionById(
  versionId: string,
): Promise<AssetVersion | undefined> {
  const [version] = await db
    .select()
    .from(assetVersions)
    .where(eq(assetVersions.id, versionId));
  return version;
}

// ---------------------------------------------------------------------------
// Stars (cached count on assets; events are the source of truth)
// ---------------------------------------------------------------------------

export async function setStar(
  principalId: string,
  asset: Asset,
  starred: boolean,
): Promise<number> {
  return db.transaction(async (tx) => {
    if (starred) {
      const inserted = await tx
        .insert(stars)
        .values({ principalId, assetId: asset.id })
        .onConflictDoNothing()
        .returning();
      if (inserted.length > 0) {
        await tx
          .update(assets)
          .set({ starCount: sql`${assets.starCount} + 1` })
          .where(eq(assets.id, asset.id));
        await emit(tx, {
          actorId: principalId,
          verb: "star.added",
          objectType: "asset",
          objectId: asset.id,
        });
      }
    } else {
      const deleted = await tx
        .delete(stars)
        .where(and(eq(stars.principalId, principalId), eq(stars.assetId, asset.id)))
        .returning();
      if (deleted.length > 0) {
        await tx
          .update(assets)
          .set({ starCount: sql`greatest(${assets.starCount} - 1, 0)` })
          .where(eq(assets.id, asset.id));
        await emit(tx, {
          actorId: principalId,
          verb: "star.removed",
          objectType: "asset",
          objectId: asset.id,
        });
      }
    }
    const [fresh] = await tx
      .select({ starCount: assets.starCount })
      .from(assets)
      .where(eq(assets.id, asset.id));
    return fresh!.starCount;
  });
}

// ---------------------------------------------------------------------------
// Edges (composition graph — stacks)
// ---------------------------------------------------------------------------

export async function listEdges(parentAssetId: string) {
  return db
    .select({
      edge: assetEdges,
      child: {
        publicId: assets.publicId,
        name: assets.name,
        slug: assets.slug,
        kindId: assets.kindId,
        visibility: assets.visibility,
      },
    })
    .from(assetEdges)
    .innerJoin(assets, eq(assetEdges.childAssetId, assets.id))
    .where(eq(assetEdges.parentAssetId, parentAssetId))
    .orderBy(assetEdges.role, assetEdges.position);
}

export interface AddEdgeInput {
  role?: string | undefined;
  position?: number | undefined;
  pinnedVersionId?: string | undefined;
}

export async function addEdge(
  parent: Asset,
  child: Asset,
  actorId: string,
  input: AddEdgeInput,
): Promise<AssetEdge> {
  if (parent.id === child.id) {
    throw new StoreError(400, "An asset cannot contain itself");
  }
  const role = input.role ?? "item";
  if (input.pinnedVersionId) {
    const pinned = await getVersionById(input.pinnedVersionId);
    if (!pinned || pinned.assetId !== child.id) {
      throw new StoreError(400, "pinnedVersionId is not a version of the child asset");
    }
  }
  return db.transaction(async (tx) => {
    let position = input.position;
    if (position === undefined) {
      const [row] = await tx
        .select({
          max: sql<number>`coalesce(max(${assetEdges.position}), -1)`,
        })
        .from(assetEdges)
        .where(
          and(eq(assetEdges.parentAssetId, parent.id), eq(assetEdges.role, role)),
        );
      position = (row?.max ?? -1) + 1;
    }
    const inserted = await tx
      .insert(assetEdges)
      .values({
        parentAssetId: parent.id,
        childAssetId: child.id,
        role,
        position,
        pinnedVersionId: input.pinnedVersionId ?? null,
      })
      .onConflictDoNothing()
      .returning();
    if (inserted.length === 0) {
      throw new StoreError(409, "Asset is already in this stack with that role");
    }
    await emit(tx, {
      actorId,
      verb: "edge.added",
      objectType: "asset_edge",
      objectId: inserted[0]!.id,
      context: { parentAssetId: parent.id, childAssetId: child.id, role },
    });
    return inserted[0]!;
  });
}

export async function removeEdge(
  parent: Asset,
  edgeId: string,
  actorId: string,
): Promise<boolean> {
  return db.transaction(async (tx) => {
    const deleted = await tx
      .delete(assetEdges)
      .where(and(eq(assetEdges.id, edgeId), eq(assetEdges.parentAssetId, parent.id)))
      .returning();
    if (deleted.length === 0) return false;
    await emit(tx, {
      actorId,
      verb: "edge.removed",
      objectType: "asset_edge",
      objectId: edgeId,
      context: { parentAssetId: parent.id, childAssetId: deleted[0]!.childAssetId },
    });
    return true;
  });
}

// ---------------------------------------------------------------------------
// PATs (token management — session-only at the route layer)
// ---------------------------------------------------------------------------

const tokenColumns = {
  id: apiTokens.id,
  name: apiTokens.name,
  scopes: apiTokens.scopes,
  lastUsedAt: apiTokens.lastUsedAt,
  expiresAt: apiTokens.expiresAt,
  revokedAt: apiTokens.revokedAt,
  createdAt: apiTokens.createdAt,
};

export async function listTokens(principalId: string) {
  return db
    .select(tokenColumns)
    .from(apiTokens)
    .where(eq(apiTokens.principalId, principalId))
    .orderBy(desc(apiTokens.createdAt));
}

export interface CreateTokenInput {
  name: string;
  scopes: string[];
  expiresAt?: Date | undefined;
}

export async function createToken(principalId: string, input: CreateTokenInput) {
  const token = newPatToken();
  const [record] = await db
    .insert(apiTokens)
    .values({
      principalId,
      name: input.name,
      tokenHash: hashToken(token),
      scopes: input.scopes,
      expiresAt: input.expiresAt ?? null,
    })
    .returning(tokenColumns);
  await emit(db, {
    actorId: principalId,
    verb: "token.created",
    objectType: "api_token",
    objectId: record!.id,
    context: { scopes: input.scopes },
  });
  return { token, record: record! };
}

export async function revokeToken(
  principalId: string,
  tokenId: string,
): Promise<boolean> {
  const revoked = await db
    .update(apiTokens)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(apiTokens.id, tokenId),
        eq(apiTokens.principalId, principalId),
        isNull(apiTokens.revokedAt),
      ),
    )
    .returning({ id: apiTokens.id });
  if (revoked.length === 0) return false;
  await emit(db, {
    actorId: principalId,
    verb: "token.revoked",
    objectType: "api_token",
    objectId: tokenId,
  });
  return true;
}
