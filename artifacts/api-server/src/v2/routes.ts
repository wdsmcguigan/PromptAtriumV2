import {
  Router,
  type IRouter,
  type Request,
  type RequestHandler,
  type Response,
} from "express";
import { z } from "zod/v4";
import { LICENSE_CODES, type Asset } from "@workspace/db";
import {
  requirePrincipal,
  requireScope,
  requireSessionAuth,
} from "./auth";
import * as store from "./store";
import { StoreError } from "./store";

// /api/v2 — the v2 asset API (docs/plans/phase-1-schema-v2.md).
// Auth: web session or PAT bearer token (see ./auth.ts). All ids in URLs are
// public ids (a_…), never internal uuids.
const router: IRouter = Router();
router.use(requirePrincipal);

const asyncHandler =
  (fn: (req: Request, res: Response) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res).catch((err: unknown) => {
      if (err instanceof StoreError) {
        return res.status(err.status).json({ message: err.message });
      }
      next(err);
    });
  };

function parse<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const detail = result.error.issues
      .map((i) => `${i.path.join(".") || "(body)"}: ${i.message}`)
      .join("; ");
    throw new StoreError(400, detail);
  }
  return result.data;
}

// --------------------------------------------------------------------------
// Schemas
// --------------------------------------------------------------------------

const visibilitySchema = z.enum(["private", "unlisted", "public"]);

const contentFileSchema = z.object({
  path: z.string().min(1).max(512),
  storageKey: z.string().min(1).max(1024),
  size: z.number().int().nonnegative(),
  sha256: z.string().regex(/^[0-9a-f]{64}$/),
});

const contentSchema = z
  .object({
    text: z.string().max(512 * 1024).optional(),
    files: z.array(contentFileSchema).min(1).max(200).optional(),
  })
  .refine((c) => (c.text !== undefined) !== (c.files !== undefined), {
    message: "content requires exactly one of text or files",
  });

const licenseSchema = z.enum(LICENSE_CODES);
const tagsSchema = z.array(z.string().min(1).max(64)).max(32);
const metadataSchema = z.record(z.string(), z.unknown());

const createAssetSchema = z.object({
  kindId: z.string().min(1).max(64),
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  visibility: visibilitySchema.optional(),
  license: licenseSchema.optional(),
  tags: tagsSchema.optional(),
  metadata: metadataSchema.optional(),
  content: contentSchema.optional(),
  changelog: z.string().max(2000).optional(),
});

const updateAssetSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(5000).nullable().optional(),
    visibility: visibilitySchema.optional(),
    license: licenseSchema.nullable().optional(),
    tags: tagsSchema.optional(),
    metadata: metadataSchema.optional(),
  })
  .refine((u) => Object.keys(u).length > 0, {
    message: "at least one field must be provided",
  });

const createVersionSchema = z.object({
  content: contentSchema,
  changelog: z.string().max(2000).optional(),
});

const listAssetsQuerySchema = z.object({
  kind: z.string().max(64).optional(),
  visibility: visibilitySchema.optional(),
  q: z.string().max(200).optional(),
  includeArchived: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

const addEdgeSchema = z.object({
  childPublicId: z.string().min(1).max(64),
  role: z.string().min(1).max(64).optional(),
  position: z.number().int().min(0).optional(),
  pinnedVersionId: z.uuid().optional(),
});

const createTokenSchema = z.object({
  name: z.string().min(1).max(100),
  scopes: z.array(z.enum(["read", "write"])).min(1).default(["read"]),
  expiresAt: z.iso.datetime().optional(),
});

// --------------------------------------------------------------------------
// Asset lookup helpers
// --------------------------------------------------------------------------

async function loadReadableAsset(req: Request): Promise<Asset> {
  const asset = await store.getAssetByPublicId(
    parse(z.string(), req.params["publicId"]),
  );
  // 404 (not 403) for assets the caller can't see: don't leak existence.
  if (!asset || !store.canRead(asset, req.v2!.principal.id)) {
    throw new StoreError(404, "Asset not found");
  }
  return asset;
}

async function loadOwnedAsset(req: Request): Promise<Asset> {
  const asset = await loadReadableAsset(req);
  if (asset.ownerId !== req.v2!.principal.id) {
    throw new StoreError(403, "Only the owner can modify this asset");
  }
  return asset;
}

// --------------------------------------------------------------------------
// Kinds
// --------------------------------------------------------------------------

router.get(
  "/kinds",
  requireScope("read"),
  asyncHandler(async (_req, res) => {
    res.json(await store.listKinds());
  }),
);

// --------------------------------------------------------------------------
// Tokens — session auth only (a PAT must not manage PATs)
// --------------------------------------------------------------------------

router.get(
  "/tokens",
  requireSessionAuth,
  asyncHandler(async (req, res) => {
    res.json(await store.listTokens(req.v2!.principal.id));
  }),
);

router.post(
  "/tokens",
  requireSessionAuth,
  asyncHandler(async (req, res) => {
    const body = parse(createTokenSchema, req.body);
    const { token, record } = await store.createToken(req.v2!.principal.id, {
      name: body.name,
      scopes: [...new Set(body.scopes)],
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
    });
    // The plaintext token appears in this response only; we store its hash.
    res.status(201).json({ ...record, token });
  }),
);

router.delete(
  "/tokens/:id",
  requireSessionAuth,
  asyncHandler(async (req, res) => {
    const revoked = await store.revokeToken(
      req.v2!.principal.id,
      parse(z.uuid(), req.params["id"]),
    );
    if (!revoked) throw new StoreError(404, "Token not found");
    res.status(204).end();
  }),
);

// --------------------------------------------------------------------------
// Assets
// --------------------------------------------------------------------------

router.get(
  "/assets",
  requireScope("read"),
  asyncHandler(async (req, res) => {
    const query = parse(listAssetsQuerySchema, req.query);
    const items = await store.listAssets(req.v2!.principal.id, {
      kindId: query.kind,
      visibility: query.visibility,
      q: query.q,
      includeArchived: query.includeArchived,
      limit: query.limit,
      offset: query.offset,
    });
    res.json({ items, limit: query.limit, offset: query.offset });
  }),
);

router.post(
  "/assets",
  requireScope("write"),
  asyncHandler(async (req, res) => {
    const body = parse(createAssetSchema, req.body);
    const { asset, version } = await store.createAsset(req.v2!.principal.id, body);
    res.status(201).json({ ...asset, headVersion: version ?? null });
  }),
);

router.get(
  "/assets/:publicId",
  requireScope("read"),
  asyncHandler(async (req, res) => {
    const asset = await loadReadableAsset(req);
    const headVersion = asset.headVersionId
      ? await store.getVersionById(asset.headVersionId)
      : null;
    res.json({ ...asset, headVersion: headVersion ?? null });
  }),
);

router.patch(
  "/assets/:publicId",
  requireScope("write"),
  asyncHandler(async (req, res) => {
    const asset = await loadOwnedAsset(req);
    const body = parse(updateAssetSchema, req.body);
    res.json(await store.updateAsset(asset, req.v2!.principal.id, body));
  }),
);

// Archive, not delete: versions and lineage stay intact (pruning, plan §assets).
router.delete(
  "/assets/:publicId",
  requireScope("write"),
  asyncHandler(async (req, res) => {
    const asset = await loadOwnedAsset(req);
    await store.archiveAsset(asset, req.v2!.principal.id);
    res.status(204).end();
  }),
);

// --------------------------------------------------------------------------
// Versions
// --------------------------------------------------------------------------

router.post(
  "/assets/:publicId/versions",
  requireScope("write"),
  asyncHandler(async (req, res) => {
    const asset = await loadOwnedAsset(req);
    const body = parse(createVersionSchema, req.body);
    const version = await store.createVersion(
      asset,
      req.v2!.principal.id,
      body.content,
      body.changelog,
    );
    res.status(201).json(version);
  }),
);

router.get(
  "/assets/:publicId/versions",
  requireScope("read"),
  asyncHandler(async (req, res) => {
    const asset = await loadReadableAsset(req);
    res.json(await store.listVersions(asset.id));
  }),
);

router.get(
  "/assets/:publicId/versions/:number",
  requireScope("read"),
  asyncHandler(async (req, res) => {
    const asset = await loadReadableAsset(req);
    const versionNumber = parse(
      z.coerce.number().int().min(1),
      req.params["number"],
    );
    const version = await store.getVersion(asset.id, versionNumber);
    if (!version) throw new StoreError(404, "Version not found");
    res.json(version);
  }),
);

// --------------------------------------------------------------------------
// Stars
// --------------------------------------------------------------------------

router.put(
  "/assets/:publicId/star",
  requireScope("write"),
  asyncHandler(async (req, res) => {
    const asset = await loadReadableAsset(req);
    const starCount = await store.setStar(req.v2!.principal.id, asset, true);
    res.json({ starred: true, starCount });
  }),
);

router.delete(
  "/assets/:publicId/star",
  requireScope("write"),
  asyncHandler(async (req, res) => {
    const asset = await loadReadableAsset(req);
    const starCount = await store.setStar(req.v2!.principal.id, asset, false);
    res.json({ starred: false, starCount });
  }),
);

// --------------------------------------------------------------------------
// Edges (stack composition)
// --------------------------------------------------------------------------

router.get(
  "/assets/:publicId/edges",
  requireScope("read"),
  asyncHandler(async (req, res) => {
    const asset = await loadReadableAsset(req);
    res.json(await store.listEdges(asset.id));
  }),
);

router.post(
  "/assets/:publicId/edges",
  requireScope("write"),
  asyncHandler(async (req, res) => {
    const parent = await loadOwnedAsset(req);
    const body = parse(addEdgeSchema, req.body);
    const child = await store.getAssetByPublicId(body.childPublicId);
    if (!child || !store.canRead(child, req.v2!.principal.id)) {
      throw new StoreError(404, "Child asset not found");
    }
    const edge = await store.addEdge(parent, child, req.v2!.principal.id, {
      role: body.role,
      position: body.position,
      pinnedVersionId: body.pinnedVersionId,
    });
    res.status(201).json(edge);
  }),
);

router.delete(
  "/assets/:publicId/edges/:edgeId",
  requireScope("write"),
  asyncHandler(async (req, res) => {
    const parent = await loadOwnedAsset(req);
    const edgeId = parse(z.uuid(), req.params["edgeId"]);
    const removed = await store.removeEdge(parent, edgeId, req.v2!.principal.id);
    if (!removed) throw new StoreError(404, "Edge not found");
    res.status(204).end();
  }),
);

export default router;
