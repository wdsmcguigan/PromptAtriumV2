# Phase 2 — MCP server: implementation appendix

*Companion to [phase-2-mcp-server.md](./phase-2-mcp-server.md). Pulls the
concrete, copy-pasteable detail out of the [design survey](../research/mcp-server-design-survey-2026-06.md)
so the build doesn't have to re-derive it: client config snippets, the resource
& tool wire design, and a **dated re-check** (2026-06-12) of every ⚠️ item in
survey §6. Assumes the hosted endpoint is `https://mcp.promptatrium.com/mcp` and
the npm package is `promptatrium-mcp` — adjust if those change.*

---

## 1. Client configuration snippets

Two connection modes per client:
- **Hosted (Streamable HTTP)** — `Authorization: Bearer pat_…` against the
  hosted endpoint. PAT comes from the user's PromptAtrium settings (`read` scope).
- **Local (`npx` stdio)** — `npx -y promptatrium-mcp`, PAT supplied via the
  `PROMPTATRIUM_TOKEN` env var (the stdio server trusts the local OS user; secret
  via env only, never a flag).

> Never paste a raw `pat_…` into a file you commit. Every snippet below reads the
> token from an env var or a prompted input. The hosted server also returns
> `WWW-Authenticate` + `/.well-known/oauth-protected-resource` (RFC 9728) so these
> same configs keep working unchanged after the OAuth follow-up lands.

### 1.1 Claude Code

**Hosted (PAT bearer).** CLI:
```bash
export PROMPTATRIUM_TOKEN=pat_xxx   # from PromptAtrium → Settings → Tokens
claude mcp add --transport http promptatrium https://mcp.promptatrium.com/mcp \
  --header "Authorization: Bearer ${PROMPTATRIUM_TOKEN}"
```
or project `.mcp.json`:
```json
{
  "mcpServers": {
    "promptatrium": {
      "type": "http",
      "url": "https://mcp.promptatrium.com/mcp",
      "headers": { "Authorization": "Bearer ${PROMPTATRIUM_TOKEN}" }
    }
  }
}
```

**Local (npx stdio).**
```bash
claude mcp add promptatrium --env PROMPTATRIUM_TOKEN=pat_xxx -- npx -y promptatrium-mcp
```
or `.mcp.json`:
```json
{
  "mcpServers": {
    "promptatrium": {
      "command": "npx",
      "args": ["-y", "promptatrium-mcp"],
      "env": { "PROMPTATRIUM_TOKEN": "pat_xxx" }
    }
  }
}
```
Verify: `/mcp` in the REPL → `promptatrium` connected; assets appear under `@promptatrium:` mentions. Claude Code refreshes on `notifications/resources/list_changed` (see §2.4).

### 1.2 Cursor

`~/.cursor/mcp.json` (global) or `.cursor/mcp.json` (project). Cursor accepts a
`headers` object and expands `${env:…}`; it does **not** do OAuth DCR, so the PAT
header is the path.

**Hosted (PAT bearer):**
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

**Local (npx stdio):**
```json
{
  "mcpServers": {
    "promptatrium": {
      "command": "npx",
      "args": ["-y", "promptatrium-mcp"],
      "env": { "PROMPTATRIUM_TOKEN": "pat_xxx" }
    }
  }
}
```
Cursor supports Resources (since v1.6, Sept 2025), Prompts, and Elicitation, so
both the resource view and the `list_assets`/`get_asset` tools work.

### 1.3 VS Code (Copilot agent mode)

`.vscode/mcp.json`. VS Code uses the `servers` key (not `mcpServers`) and a
first-class `inputs` block so the PAT is prompted + stored in secret storage, not
committed.

**Hosted (PAT bearer):**
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

**Local (npx stdio):**
```json
{
  "inputs": [
    { "type": "promptString", "id": "pat", "description": "PromptAtrium PAT", "password": true }
  ],
  "servers": {
    "promptatrium": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "promptatrium-mcp"],
      "env": { "PROMPTATRIUM_TOKEN": "${input:pat}" }
    }
  }
}
```
VS Code also auto-handles OAuth (browser flow) if an `oauth` block is configured —
that's the future path; the PAT header works today. Resources surface via
**Add Context → MCP Resources**; prompt-kind assets via `/promptatrium.<prompt>`.

### 1.4 Claude.ai custom connector — header gap (re-verified 2026-06-12)

**Status: still OAuth-only. No raw-header / PAT path. Unchanged from the survey,
and now confirmed it won't change.**

- Official connector-auth docs (`claude.com/docs/connectors/building/authentication`)
  state plainly: **user-pasted bearer tokens (`static_bearer`) are "not yet
  supported,"** and tokens/API keys in the connector URL are not supported. The
  only accepted methods are `oauth_dcr` (Dynamic Client Registration),
  `oauth_cimd` (Client ID Metadata Document), `oauth_anthropic_creds` (gated —
  email mcp-review@anthropic.com), gated custom connections, and `none` (authless).
  The page tracks MCP spec `2025-11-25`.
- The specific bug, **`anthropics/claude-ai-mcp#112`** ("Cannot configure
  `Authorization: Bearer` for custom remote MCP"), was **closed as _not planned_**
  (~March 2026). The umbrella request **`#10`** ("Support custom headers for
  connectors") is **still open** with no maintainer commitment.

**Implication for PromptAtrium:** Claude.ai web users cannot connect with a PAT.
They are served by the **OAuth follow-up** (survey §1.5 v2: CIMD + DCR-fallback),
not this build. `none`/authless is not an option because asset access is
per-user. No action for v1 beyond shipping the RFC 9728 metadata stub now so the
OAuth upgrade is additive. **Re-check `#10` before starting the OAuth follow-up.**

---

## 2. Resource & tool wire design

The server exposes the **same content three ways** so it renders on every client:
resources (richest, for clients with good resource UX), the `skill://` scheme for
skill-kind assets (SEP-2640 alignment), and `list_assets`/`get_asset` tools (the
universal hedge — tools work everywhere, resources don't yet).

### 2.1 `asset://` URI templates (non-skill kinds)

Register as MCP **resource templates** (RFC 6570; `resources/templates/list`):

| Template | Resolves to | mimeType |
|---|---|---|
| `asset://{owner}/{slug}` | latest **published** version of the asset | per kind (below) |
| `asset://{owner}/{slug}/v/{version}` | a pinned version (semver or label e.g. `production`) | per kind |

- `{owner}` = PromptAtrium username/org slug; `{slug}` = asset slug. Both
  URL-safe; one asset = one `owner/slug`.
- **mimeType by kind:** `rule`, `command`, `prompt` → `text/markdown`;
  `mcp-server` → `application/json` (the canonical config block, secrets as
  **references** only — never values, per plan 30). `skill` is served via
  `skill://` instead (§2.2).
- The **latest-pointing** URI (`asset://{owner}/{slug}`) is stable but its
  *content* changes when a new version is published → drives `listChanged`
  (§2.4). The **pinned** URI is immutable.
- `resources/list` enumerates the caller's assets (concrete URIs); templates let
  a client/model address an asset it knows by name without a prior list. Both
  paginate via `cursor`/`nextCursor`.

Each resource carries annotations:
```json
{
  "uri": "asset://acme/pr-review-rules",
  "name": "pr-review-rules",
  "title": "PR review rules",
  "description": "House rules for reviewing pull requests.",
  "mimeType": "text/markdown",
  "annotations": {
    "audience": ["assistant"],
    "lastModified": "2026-06-10T14:23:00Z"
  }
}
```

### 2.2 `skill://` mapping (skill-kind assets, per SEP-2640)

Skill-kind assets follow the **experimental** Skills-over-MCP scheme
(`modelcontextprotocol/experimental-ext-skills`, PR #2640 — **open draft, not yet
in core spec**). It uses the **existing Resources primitives** — no new methods:

| URI | Content |
|---|---|
| `skill://{owner}/{slug}/SKILL.md` | the skill's `SKILL.md` (frontmatter + body) |
| `skill://{owner}/{slug}/{file-path}` | a bundled resource file relative to the skill dir |
| `skill://index.json` | optional discovery index of available skills |

- Discovery via `resources/list` (optional — and per the draft, *"clients MUST NOT
  treat an empty or absent enumeration as proof that a server has no skills"*);
  access via `resources/read` on any `skill://` URI.
- Versioning: keep the same `lastModified` mechanism; expose a pinned form
  `skill://{owner}/{slug}/v/{version}/SKILL.md` if/when needed.
- **Because SEP-2640 is unstable, keep the canonical → `skill://` mapping inside
  `@workspace/asset-core`** so a scheme change is an adapter edit, not a server
  rewrite. Also still surface skills through `list_assets`/`get_asset` so they
  work on clients that don't grok `skill://`.

### 2.3 `lastModified` + `listChanged` usage

- **`lastModified`** on every resource = the served version's `createdAt`
  (ISO 8601 / RFC 3339). For latest-pointing URIs it bumps when a new version is
  published; for pinned URIs it's immutable. This is the **dependable** version
  signal clients can compare cheaply.
- **Declare the `resources.listChanged` capability** and emit
  `notifications/resources/list_changed` when the caller's set changes: asset
  added/removed/renamed, **or** a new version published (since a latest-pointing
  URI's content changed). Claude Code honors this and refreshes without a
  reconnect (confirmed, §3).
- **Do NOT rely on `resources/subscribe`** / `notifications/resources/updated`.
  Claude Code closed per-resource subscriptions as *not planned* (`#7252`); Cursor
  and VS Code don't document support. Implement `subscribe` only as best-effort if
  cheap; treat `listChanged` + `lastModified` as the contract.

### 2.4 Tools — JSON Schemas (the universal hedge)

JSON Schema dialect is **2020-12** (the spec default since `2025-11-25`). Both
tools return their payload as **`resource_link`** (and, for `get_asset`, an
embedded resource) so a tool call hands back the same addressable content a
resource-aware client would have read directly.

**`list_assets`**
```json
{
  "name": "list_assets",
  "title": "List PromptAtrium assets",
  "description": "List the caller's available assets (rules, skills, commands, prompts, mcp-server configs). Returns resource_link items addressable via asset:// or skill:// URIs.",
  "inputSchema": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "properties": {
      "kind": {
        "type": "string",
        "enum": ["rule", "skill", "command", "prompt", "mcp-server"],
        "description": "Optional filter by asset kind."
      },
      "query": {
        "type": "string",
        "description": "Optional full-text filter over name, description, and tags."
      },
      "cursor": {
        "type": "string",
        "description": "Opaque pagination cursor returned as nextCursor by a previous call."
      }
    },
    "additionalProperties": false
  }
}
```
Example result (note `resource_link` blocks + `nextCursor` echoed in text/`_meta`):
```json
{
  "content": [
    { "type": "text", "text": "3 assets (showing 1–3). Pass cursor to page." },
    {
      "type": "resource_link",
      "uri": "asset://acme/pr-review-rules",
      "name": "pr-review-rules",
      "title": "PR review rules",
      "mimeType": "text/markdown",
      "description": "House rules for reviewing pull requests."
    },
    {
      "type": "resource_link",
      "uri": "skill://acme/release-notes/SKILL.md",
      "name": "release-notes",
      "title": "Release-notes skill",
      "mimeType": "text/markdown"
    },
    {
      "type": "resource_link",
      "uri": "asset://acme/sentry-mcp",
      "name": "sentry-mcp",
      "title": "Sentry MCP server config",
      "mimeType": "application/json"
    }
  ]
}
```

**`get_asset`**
```json
{
  "name": "get_asset",
  "title": "Get a PromptAtrium asset",
  "description": "Fetch the full content of one asset by name, optionally pinned to a version. Returns the asset body as an embedded resource plus a resource_link for re-reference. Defaults to the latest published version.",
  "inputSchema": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "properties": {
      "name": {
        "type": "string",
        "pattern": "^[^/]+/[^/@]+$",
        "description": "Asset identifier in 'owner/slug' form, e.g. 'acme/pr-review-rules'."
      },
      "version": {
        "type": "string",
        "description": "Optional version: a semver (e.g. '1.4.0') or a label (e.g. 'production'). Defaults to the latest published version."
      }
    },
    "required": ["name"],
    "additionalProperties": false
  }
}
```
Example result (embedded resource = the content; resource_link = stable handle):
```json
{
  "content": [
    {
      "type": "resource",
      "resource": {
        "uri": "asset://acme/pr-review-rules/v/1.4.0",
        "mimeType": "text/markdown",
        "text": "---\nkind: rule\nname: pr-review-rules\n---\n# PR review rules\n…"
      }
    },
    {
      "type": "resource_link",
      "uri": "asset://acme/pr-review-rules",
      "name": "pr-review-rules",
      "title": "PR review rules (latest)",
      "mimeType": "text/markdown"
    }
  ]
}
```
On unknown `name`/`version`, return a **tool execution error** (`isError: true`
with a text reason) — not a protocol error — per the `2025-11-25` convention.

> The `prompt`-kind assets are *additionally* exposed as MCP **Prompts**
> (`prompts/list` + `prompts/get`) so they show up as slash commands
> (`/promptatrium.<name>` in VS Code, the prompt picker in Claude Code). Tools +
> resources remain the cross-client baseline.

---

## 3. Dated re-check of survey §6 ⚠️ risk items (verified 2026-06-12)

Primary sources re-fetched today. Net: **no decision in the locked plan changes.**
Two registry nits resolved, and the `2026-07-28` date is clarified.

| # | Survey §6 item | Status re-verified 2026-06-12 | Source | Action |
|---|---|---|---|---|
| 1 | Stateless-core "next" spec (removes `initialize` handshake + `Mcp-Session-Id`) | **Real RC, announced 2026-05-21, targeting `2026-07-28` final.** The "2026-07-28 blog post" is the RC announcement *published 2026-05-21*; `2026-07-28` is the announced **target** date, **not yet published**. **Latest *published* spec remains `2025-11-25`.** RC does remove the handshake + session id. | blog.modelcontextprotocol.io/posts/2026-07-28-release-candidate/ (pub 2026-05-21); github.com/modelcontextprotocol/modelcontextprotocol/releases (`2026-07-28-RC`, pre-release); /specification/draft | **No change.** Plan already mandates stateless-friendly design (no `Mcp-Session-Id` dependency). On track for the migration. |
| 2 | SDK v1 → v2 package split | **v1 is the stable line: `@modelcontextprotocol/sdk@1.29.0` (pub 2026-03-30)**, subpath imports + `StreamableHTTPServerTransport` confirmed. **v2 has NOT shipped stable** — `@modelcontextprotocol/server`/`client` are `2.0.0-alpha.2` only. | npmjs.com/package/@modelcontextprotocol/sdk; registry.npmjs.org/@modelcontextprotocol/server | **No change.** Pin `^1.x` (plan §2). Do not adopt v2 alpha. |
| 3 | DCR demoted SHOULD→MAY, CIMD promoted →SHOULD (`2025-11-25`) | **Confirmed** verbatim in the published `2025-11-25` auth spec. Priority: pre-registration → CIMD → DCR fallback. | /specification/2025-11-25/basic/authorization | **No change.** Affects the OAuth follow-up, not v1 PAT build. |
| 4 | CIMD rests on an IETF draft | **Still pre-RFC.** `draft-ietf-oauth-client-id-metadata-document` advanced to **`-01` (revised 2026-03-02, expires 2026-09-03)**; spec text still links `-00`. WG-adopted, not an RFC. | datatracker.ietf.org/doc/draft-ietf-oauth-client-id-metadata-document/ | **No change.** Don't build CIMD-only; permanent PAT fallback insulates us. Re-check at OAuth-follow-up start. |
| 5 | Resource-primitive UX uneven across clients | **Confirmed, improving but still uneven.** Cursor Resources since v1.6 (Sept 2025); VS Code surfaces Resources (Add Context, docs dated 2026-06-10); Claude Code full `@`-mention support; Claude.ai weakest. | cursor.com/docs/mcp; code.visualstudio.com/docs/copilot/customization/mcp-servers; code.claude.com/docs/en/mcp | **No change.** Keep the `list_assets`/`get_asset` tool hedge (plan §3, appendix §2.4). |
| 6 | `resources/subscribe` honored inconsistently | **Confirmed worse than "inconsistent."** Claude Code **honors `list_changed`** but **closed per-resource `subscribe` as _not planned_ (`anthropics/claude-code#7252`)**. Cursor/VS Code: no documented subscribe support. | code.claude.com/docs/en/mcp; github.com/anthropics/claude-code/issues/7252 | **No change.** Rely on `listChanged` + `lastModified`; `subscribe` best-effort only (appendix §2.3). |
| 7 | SEP-2640 `skill://` experimental | **Still experimental.** PR #2640 **open/draft** (updated ~2026-06-08); `experimental-ext-skills` states it is **not** an official spec. Scheme confirmed: `skill://<path>/SKILL.md` + `skill://<path>/<file>` via `resources/list`+`resources/read`; discovery index `skill://index.json`. | github.com/modelcontextprotocol/modelcontextprotocol/pull/2640; github.com/modelcontextprotocol/experimental-ext-skills/blob/main/docs/skill-uri-scheme.md | **No change.** Align to it, keep mapping in `@workspace/asset-core` (appendix §2.2). |
| 8 | Official registry is preview | **Still PREVIEW** (live banner; launched 2025-09-08, no GA). Schema pinned at **`2025-12-11`**. **Resolved nits:** `registryType` enum **does include `cargo`** (full: npm/pypi/cargo/oci/nuget/mcpb); read API path is **`/v0/`** (not `/v0.1/`), verified against the live API. | modelcontextprotocol.io/registry/about; registry.modelcontextprotocol.io/v0/servers; static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json | **Minor:** correct the survey §5 nits — use `/v0/` and know `cargo` is valid. Still "prepare, don't depend" (plan §4). |
| 9 | Claude.ai custom-connector header gap (`#112`) | **Resolved as "won't fix."** `#112` **closed _not planned_** (~Mar 2026); umbrella `#10` **still open**. Docs: `static_bearer` "not yet supported"; OAuth-only (`oauth_dcr`/`oauth_cimd`/`oauth_anthropic_creds`/`none`). | github.com/anthropics/claude-ai-mcp/issues/112 & /issues/10; claude.com/docs/connectors/building/authentication | **No change.** Claude.ai = OAuth follow-up only (appendix §1.4). Re-check `#10` before that follow-up. |

### Net assessment
Every locked decision in `phase-2-mcp-server.md` survives re-verification. Only
edits warranted are cosmetic survey corrections (registry `/v0/` path; `cargo`
present; the `2026-07-28` date is an *announced target*, latest published spec is
`2025-11-25`). The build can proceed on the plan's build order as written.

---

## Sources (re-verified 2026-06-12)

- Spec/SDK: https://blog.modelcontextprotocol.io/posts/2026-07-28-release-candidate/ ·
  https://github.com/modelcontextprotocol/modelcontextprotocol/releases ·
  https://modelcontextprotocol.io/specification/draft ·
  https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization ·
  https://www.npmjs.com/package/@modelcontextprotocol/sdk ·
  https://datatracker.ietf.org/doc/draft-ietf-oauth-client-id-metadata-document/
- Clients: https://code.claude.com/docs/en/mcp ·
  https://cursor.com/docs/mcp ·
  https://code.visualstudio.com/docs/copilot/customization/mcp-servers ·
  https://claude.com/docs/connectors/building/authentication ·
  https://github.com/anthropics/claude-ai-mcp/issues/112 ·
  https://github.com/anthropics/claude-ai-mcp/issues/10 ·
  https://github.com/anthropics/claude-code/issues/7252
- Registry/skills: https://modelcontextprotocol.io/registry/about ·
  https://registry.modelcontextprotocol.io/v0/servers ·
  https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json ·
  https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2640 ·
  https://github.com/modelcontextprotocol/experimental-ext-skills/blob/main/docs/skill-uri-scheme.md
