# promptatrium-mcp

An [MCP](https://modelcontextprotocol.io) server over the PromptAtrium v2 asset
store. It lets Claude Code, Cursor, and VS Code pull your versioned assets —
rules, skills, commands, prompts, and mcp-server configs — directly into the
tool, addressed as `asset://{handle}/{slug}` (and `skill://…/SKILL.md` for
skills).

Two modes from one codebase:

- **Hosted (Streamable HTTP):** `https://mcp.promptatrium.com/mcp`, authenticated
  with a personal access token (`Authorization: Bearer pat_…`).
- **Local (`npx` stdio):** `npx -y promptatrium-mcp`, with the PAT in the
  `PROMPTATRIUM_TOKEN` env var.

Both are a thin front-end over the v2 HTTP API (`/api/v2`); the server never
touches the database. Get a token from **PromptAtrium → Settings → Tokens**
(`read` scope is enough).

> Never paste a raw `pat_…` into a file you commit. Every snippet below reads it
> from an env var or a prompted input.

## What it exposes

- **Tools (the universal hedge — work on every client):** `list_assets`
  (optionally filtered by `kind`/`query`) and `get_asset` (`owner/slug`, optional
  integer `version`). Both hand back `resource_link`s; `get_asset` also embeds the
  body.
- **Resources:** `asset://{handle}/{slug}` and the pinned
  `asset://{handle}/{slug}/v/{version}`; skill-kind assets via the experimental
  [SEP-2640](https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2640)
  `skill://{handle}/{slug}/SKILL.md` scheme. `resources.listChanged` is declared;
  per-resource `subscribe` is not relied upon.
- **Prompts:** `prompt`-kind assets surface as MCP prompts (slash commands).

## Client configuration

### Claude Code

Hosted (PAT bearer):

```bash
export PROMPTATRIUM_TOKEN=pat_xxx
claude mcp add --transport http promptatrium https://mcp.promptatrium.com/mcp \
  --header "Authorization: Bearer ${PROMPTATRIUM_TOKEN}"
```

Local (npx stdio):

```bash
claude mcp add promptatrium --env PROMPTATRIUM_TOKEN=pat_xxx -- npx -y promptatrium-mcp
```

### Cursor — `~/.cursor/mcp.json` or `.cursor/mcp.json`

```json
{
  "mcpServers": {
    "promptatrium": {
      "url": "https://mcp.promptatrium.com/mcp",
      "headers": { "Authorization": "Bearer ${env:PROMPTATRIUM_TOKEN}" }
    }
  }
}
```

### VS Code (Copilot agent mode) — `.vscode/mcp.json`

```json
{
  "inputs": [
    { "type": "promptString", "id": "pat", "description": "PromptAtrium PAT", "password": true }
  ],
  "servers": {
    "promptatrium": {
      "type": "http",
      "url": "https://mcp.promptatrium.com/mcp",
      "headers": { "Authorization": "Bearer ${input:pat}" }
    }
  }
}
```

### Claude.ai

Claude.ai custom connectors are OAuth-only — no raw-header / PAT path
([issue #112](https://github.com/anthropics/claude-ai-mcp/issues/112) closed as
not-planned). Claude.ai is served by the OAuth follow-up, not this build. The
server already ships the RFC 9728 metadata stub so that upgrade is additive.

## Auth shape (OAuth-ready)

PAT bearer is the permanent v1 path, shaped as an OAuth 2.1 resource server: a
request with no token gets `401` + `WWW-Authenticate: Bearer
resource_metadata="…"`, and `/.well-known/oauth-protected-resource/mcp`
(RFC 9728) is served. The OAuth Authorization Server (CIMD + DCR fallback) is a
future follow-up that drops in without breaking existing PAT configs.

## Develop

```bash
pnpm --filter promptatrium-mcp run typecheck
pnpm --filter promptatrium-mcp run build      # tsc -> dist/ (ESM, with .d.ts)
PROMPTATRIUM_TOKEN=pat_xxx pnpm --filter promptatrium-mcp run start   # stdio
PROMPTATRIUM_API_URL=http://127.0.0.1:8080 pnpm --filter promptatrium-mcp run serve:http
```

`mountMcpServer(app, { apiBaseUrl })` mounts the `/mcp` endpoint (+ RFC 9728
metadata) onto an existing Express app, e.g. `@workspace/api-server`.

## Registry (prepare, don't depend)

`server.json` is checked in but **unpublished**. `mcpName`
(`io.github.wdsmcguigan/promptatrium`) is reserved in `package.json`. Publish to
`registry.modelcontextprotocol.io` (read API `/v0/`, schema `2025-12-11`) only
once it firms up past preview; the community registries (Glama, PulseMCP, mcp.so,
Smithery) syndicate from public GitHub, so open-sourcing this package is the
distribution play.

Checklist before publishing:

- [ ] `npm publish` `promptatrium-mcp` (public).
- [ ] Verify `mcpName` matches `server.json` `name`.
- [ ] Stand up the hosted endpoint at `https://mcp.promptatrium.com/mcp`.
- [ ] Submit `server.json` to the official registry once it exits preview.
