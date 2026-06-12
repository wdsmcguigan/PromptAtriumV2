# Phase 2 MCP server (scaffold)

Built per `docs/plans/phase-2-mcp-server.md` + appendix + the Schema seams
section. Status: scaffold complete, typechecks, smoke-tested end-to-end (real
MCP SDK client over both transports). NOT yet deployed/published.

## Principal handles (Schema seam #1 — Owner-approved 2026-06-12)
- `principals.handle` is now **required + unique** (`lib/db/src/schema/v2.ts`,
  index `principals_handle_idx`). It is the `{handle}` in `asset://{handle}/{slug}`.
- Migration `lib/db/migrations/0003_principal-handles.sql` — hand-edited after
  `drizzle-kit generate` (the bare `ADD COLUMN … NOT NULL` it emits fails on a
  non-empty table). Adds nullable → backfills from `users.username` (Postgres
  `lower`+`regexp_replace` slug) with `user-<short-id>` fallbacks → a window
  function appends a 12-hex id suffix to any duplicate → `SET NOT NULL` + unique
  index. Validated on scratch PG 16: 7 principals incl. case-collisions
  (`Alice`/`alice`), null username, slug-to-empty (`!!!`), diacritics, and the
  null-user_id curation principal — all unique, no nulls. **The snapshot
  (`meta/0003_snapshot.json`) already reflects the final state**, so future
  `generate` runs stay consistent; don't regenerate 0003.
- New principals get a handle at creation: `v2/auth.ts getOrCreatePrincipalForUser`
  (derives from username via `v2/handles.ts generateUniqueHandle`),
  `import-seed.ts` curation principal → fixed handle `promptatrium`,
  `backfill-v2.ts` principal INSERT (handle-aware, idempotent — same collision
  logic in SQL). **Any new principal insert MUST set handle** (column is NOT NULL).
- Seam #2 (versions are integers, not semver) and seam #3 (latest = head of a
  visible asset) are honored as-is; no schema change.

## v2 API additions (`artifacts/api-server/src/v2/`)
- `GET /api/v2/me` → `{ principal: { handle, kind }, scopes, via }` so MCP clients
  learn their own handle.
- `GET /api/v2/handles/:handle/assets/:slug` (+ `/versions/:number`) → handle-
  addressed reads, `canRead`-gated (404 not 403). `store.getAssetByHandleAndSlug`.
- `ownerHandle` added to list items + single-asset responses (`store.getOwnerHandle`;
  list uses `req.v2.principal.handle` — all items are the caller's own).

## The package — `artifacts/mcp-server` (npm: `promptatrium-mcp`)
- **Thin front-end over the v2 HTTP API** (`/api/v2`); never touches the DB, so
  stdio (npx, on the user's machine) and hosted HTTP share one code path. Data
  access is `HttpPromptAtriumClient` (`src/client.ts`), PAT forwarded as bearer.
- `src/core/server.ts createMcpServer(ctx)` — transport-agnostic. Tools
  `list_assets`/`get_asset` (the universal hedge), resources
  `asset://{handle}/{slug}` (+ pinned `/v/{version}`) and SEP-2640
  `skill://{handle}/{slug}/{+filePath}`, prompt-kind assets as MCP prompts.
  `resources.listChanged` declared; no reliance on per-resource `subscribe`.
  Async because prompts are registered up front (no dynamic prompt-list in the SDK).
- `src/transport/stdio.ts` — bin (`promptatrium-mcp`), PAT from
  `PROMPTATRIUM_TOKEN`, base from `PROMPTATRIUM_API_URL` (default hosted), logs to
  **stderr only** (stdout is the JSON-RPC pipe).
- `src/transport/http.ts` — `mountMcpServer(app, opts)` / `createMcpHttpApp`.
  Single `/mcp` path (POST+GET+DELETE), per-session server factory closing over
  the request's PAT, Origin allowlist → 403, bearer middleware → 401 +
  `WWW-Authenticate`, RFC 9728 `/.well-known/oauth-protected-resource/mcp` stub
  (empty `authorization_servers` — OAuth AS is the follow-up). `serve-http.ts` is
  a standalone runner.
- **SDK pinned `@modelcontextprotocol/sdk@^1.29.0`** (v1 stable; v2 is alpha).
  All transport wiring isolated in `src/transport/` so the SDK v2 split is a
  one-file migration. **The package uses plain `zod` v3** (the SDK's peer), NOT
  `zod/v4` — this is the one place in the repo that diverges from the zod-v4 rule.
- Build = `tsc -p tsconfig.build.json` (NodeNext, `.js`-extension relative imports,
  emits ESM + .d.ts to `dist/`). `package.json`: `type: module`, `bin`,
  `files: ["dist","server.json","README.md"]`, `mcpName`.
- `server.json` checked in but **unpublished** (registry "prepare, don't depend").

## Not built (deliberately — see plan "Out of scope")
OAuth 2.1 AS (CIMD/DCR — Claude.ai's only path; #112 closed not-planned),
per-resource subscriptions beyond best-effort, write tools, elicitation, registry
GA publish, per-tool compiled variants (that's `@workspace/asset-core`/plan 30 —
the server serves canonical content until then). The api-server does NOT mount
`/mcp` by default (would pull the SDK into the server bundle); `mountMcpServer` is
provided for when the hosted endpoint is wired up.

## Deploy note
`migrate:v2` now also applies 0003 (handles). The deploy gate (OWNER-TODO #1) is
unchanged in steps, but after it runs, every principal has a handle.
