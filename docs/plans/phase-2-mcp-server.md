# Phase 2 — MCP server

*Decisions locked from [the MCP design survey](../research/mcp-server-design-survey-2026-06.md)
(June 2026). Depends on: v2 asset API + PATs (shipped), and
`@workspace/asset-core` ([plan 30](../research/30-asset-sync-adapters.md)) for
per-tool compilation. Re-check the ⚠️ items in the survey §6 before lock-in.*

## What & Why

A thin MCP front-end over the v2 asset store so Claude Code, Cursor, VS Code,
and Claude.ai can pull a user's versioned assets (rules, skills, commands,
prompts, mcp-server configs) directly. Two modes from one codebase: a hosted
remote endpoint and a local `npx` stdio server.

## The locked decisions (survey §0)

1. **Auth v1 = PAT bearer, shaped as an OAuth 2.1 resource server.** Accept
   `Authorization: Bearer pat_…` validated against `api_tokens` (already
   shipped, `read` scope). Also serve `WWW-Authenticate` on 401 and
   `/.well-known/oauth-protected-resource` (RFC 9728) from day one so the
   later OAuth upgrade is purely additive. PAT fallback is **permanent**
   (the Linear model — Notion/Sentry's OAuth-purity backlog is the cautionary
   tale). OAuth itself (CIMD + DCR-fallback, short-lived tokens) is a v2
   follow-up, not this build.
2. **Transports: Streamable HTTP (remote) + stdio (local), never HTTP+SSE.**
   SDK pinned to **v1 `@modelcontextprotocol/sdk` (`^1.x`)**; all transport
   wiring isolated in `src/transport/` so the ~2026-07-28 SDK v2 split is a
   one-file migration. Design stateless-friendly: no hard dependency on
   `Mcp-Session-Id` or long-held SSE streams.
3. **Primitive: Resources first, Tool hedge always.** Assets served as
   resources (`asset://{owner}/{slug}` templates, `text/*` mimeTypes,
   `lastModified` = version createdAt, `listChanged` declared). Skills follow
   the emerging **SEP-2640 `skill://…/SKILL.md`** scheme. Because resource UX
   is still uneven (Claude.ai especially), also expose `list_assets` /
   `get_asset(name, version?)` tools returning the same content via
   `resource_link`. Per-resource `resources/subscribe` is best-effort only.
4. **Registry: prepare, don't depend.** Ship via `npx` + hosted URL. Reserve
   `io.github.wdsmcguigan/promptatrium` (`mcpName` in package.json), keep
   `server.json` ready, publish to `registry.modelcontextprotocol.io` only
   when it firms up past preview. The community registries (Glama, PulseMCP,
   mcp.so, Smithery) syndicate from public GitHub — open-sourcing the server
   package is the distribution play (per the GTM memo).

## Schema seams (appendix ↔ actual v2 schema)

The [implementation appendix](phase-2-mcp-server-appendix.md) is written from
spec-land; these are the three places it meets the real schema (from the PR #8
review, reconciled here so the build session doesn't have to find a buried
comment). None change the locked decisions.

1. **`{owner}` doesn't exist yet.** `asset://{owner}/{slug}` assumes a URL-safe
   owner handle, but v2 `principals` are bare uuids (kind + user_id) — no
   slug/username, and legacy `users.username` is nullable. **Decision needed
   from the owner before the scaffold bakes in addressing** (parked with him):
   either add a required `handle` to principals (backfill from username with
   generated fallbacks) — recommended, `owner/slug` is much better model-facing
   UX — or make the canonical URI `asset://{public_id}` and treat `owner/slug`
   as a friendly alias later.
2. **Versions are integers, not semver.** `asset_versions.version_number` is a
   monotonic int with no label system. `get_asset.version` is an integer
   (`/v/3`), and `asset://{owner}/{slug}/v/{version}` takes the integer. The
   semver/`production`-label model in appendix §2.4 is a future enhancement
   (Langfuse prior art), not current schema.
3. **"Latest published version" = head version of a visible asset.** There is
   no per-version publish state — only `assets.head_version_id` + asset-level
   `visibility`. Same semantics (PAT-scoped callers see their own + public
   assets); implement against `head_version_id`.

## Done looks like

- New workspace package `artifacts/mcp-server` (`promptatrium-mcp` on npm):
  - `src/core/` — `createMcpServer(ctx)`: transport-agnostic; registers
    resources (assets + `skill://`), tools (`list_assets`, `get_asset`), and
    prompt-kind assets as MCP prompts. Reads via the v2 store / HTTP API.
  - `src/transport/stdio.ts` — bin entry (`#!/usr/bin/env node`), one shared
    server instance, PAT from `PROMPTATRIUM_TOKEN`, logs to stderr only.
  - `src/transport/http.ts` — Express 5 mount: single `/mcp` path for
    POST+GET+DELETE, per-session server factory, `Origin` validation (403),
    bearer middleware + RFC 9728 metadata. Mountable into
    `@workspace/api-server` or standalone.
- `package.json`: `"type": "module"`, `bin`, `files: ["dist"]`, `mcpName`.
- Works against: Claude Code (`--header` PAT remote, and `npx` stdio), Cursor
  (`headers` in mcp.json), VS Code (`headers` + input vars). Claude.ai gets
  the OAuth follow-up (header gap, survey §6).
- `server.json` checked in but unpublished; registry checklist (survey §5)
  tracked in this doc.

## Out of scope (this build)

OAuth 2.1 AS + CIMD/DCR (v2 follow-up), per-resource subscriptions beyond
best-effort, write tools (publish/update from the agent side), elicitation
flows, registry GA publishing, per-tool *compilation* output (that's
`@workspace/asset-core`'s emit path — the MCP server serves canonical content
until plan 30 lands, then adds compiled variants).

## Build order

1. Package scaffold + pinned v1 SDK; `createMcpServer` with `list_assets` /
   `get_asset` tools backed by the v2 store (smallest useful server).
2. stdio transport + bin; verify in Claude Code via `npx` locally.
3. Streamable HTTP transport + PAT middleware + RFC 9728 stub; mount in
   api-server; verify in Claude Code (`--header`) and Cursor.
4. Resources + templates + `listChanged`; `skill://` for skill-kind assets.
5. `server.json` + `mcpName`; open-source the package; submit to community
   registries.
6. (After plan 30) compiled per-tool variants as additional resources.
