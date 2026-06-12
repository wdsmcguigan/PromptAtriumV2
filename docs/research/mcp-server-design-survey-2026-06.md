# MCP Server Design Survey & Recommendation Memo (Phase 2)

**Subject:** Designing PromptAtrium's MCP server to sync versioned assets (rule / skill / command / prompt / mcp-server) into Claude Code, Cursor, VS Code, and Claude.ai.
**Date:** 2026-06-12
**Status:** Research deliverable. Decisions here are recommendations for the Phase 2 build; flagged items are genuinely unsettled in the ecosystem and should be re-checked before lock-in.
**Audience:** PromptAtrium backend/infra (Express 5 + Postgres, pnpm workspaces, Drizzle, PATs planned). The MCP server is a thin transport + auth front-end over the existing/planned `@workspace/asset-core` canonical model and adapters.

> Method note: findings below were gathered from primary sources (the MCP spec at `modelcontextprotocol.io` and its GitHub repos, official client docs for Claude Code / Cursor / VS Code / Claude.ai, and real server repositories). Load-bearing facts (current spec revision, transport status, auth direction) were independently corroborated by 2+ searches with quoted spec text. Where sources conflict or a claim rests on a single non-primary source, it is **flagged**.

---

## 0. TL;DR — the four decisions

1. **Auth (v1): ship PAT/bearer now, design the server as an OAuth 2.1 *resource server* from day one.** Accept `Authorization: Bearer <PAT>` (the PATs you already plan), validate them, and — critically — also serve the OAuth discovery documents (`/.well-known/oauth-protected-resource`) pointing at your own authorization server as a no-op/placeholder so the upgrade is additive. This mirrors exactly what **Linear** ships (OAuth + direct token/API-key fallback in the same `Authorization: Bearer` header). It maximizes client reach today (Cursor and VS Code both accept pasted bearer headers; Claude Code accepts `--header`) without painting you into a corner.
2. **Transport:** **Streamable HTTP** for the hosted remote server, **stdio** for the local `npx` server, from **one codebase**. Do **not** implement the deprecated HTTP+SSE transport. Build on the **v1 `@modelcontextprotocol/sdk`** (subpath imports) and isolate transport wiring in one module so the imminent SDK v2 split is a one-file migration.
3. **Primitive:** serve assets primarily as **Resources** (URI-addressable, `mimeType: text/*`, `lastModified`, `resources/list` + `listChanged`), align skill delivery with the emerging **`skill://` SEP-2640** scheme, and **also expose a retrieval Tool** as a portability hedge because resource UX is now broad but still uneven across clients.
4. **Registry:** plan to list, but treat `registry.modelcontextprotocol.io` as **preview** (not GA). Reserve the `io.github.<org>/...` namespace, publish the npx package with the `mcpName` ownership marker, and keep the `server.json` ready — but don't depend on the registry as a distribution channel yet.

---

## 1. Auth

### 1.1 What the spec actually requires

MCP authorization is **optional and HTTP-transport-only**. When present, the spec (revisions `2025-06-18` and the current `2025-11-25`) models the **MCP server as an OAuth 2.1 _resource server_**, not an authorization server — the AS is a separate role that may be co-hosted or external. Normative requirements when you do implement OAuth:

- **OAuth 2.1 + PKCE (S256)** — clients MUST implement PKCE.
- **RFC 9728 Protected Resource Metadata** — servers MUST publish it; clients MUST use it for AS discovery.
- **RFC 8707 Resource Indicators** — clients MUST send the `resource` parameter; servers MUST validate token audience. Token pass-through is explicitly forbidden: *"MCP clients MUST NOT send tokens to the MCP server other than ones issued by the MCP server's authorization server."*

**The spec does not bless static PATs as a discovery-based flow.** But the wire format is just `Authorization: Bearer <token>`, and a hand-configured header bypasses the OAuth discovery path entirely. That is a **client/server convention, not a spec violation** — and it is exactly how several production servers ship a fallback. This distinction is the basis for the v1 recommendation.

### 1.2 The biggest auth change: `2025-11-25` reshuffled client registration

This is the "build to where the spec is going" headline. Between `2025-06-18` and `2025-11-25`:

- **Dynamic Client Registration (RFC 7591) was demoted from SHOULD → MAY** and reframed as legacy/backwards-compat.
- **Client ID Metadata Documents (CIMD) promoted to the recommended (SHOULD) mechanism.** The new registration priority is: pre-registered creds → CIMD → DCR fallback → prompt the user.
- Added **OIDC Discovery 1.0** alongside RFC 8414; made the RFC 9728 `WWW-Authenticate` header optional with a `.well-known` probe fallback; added a formal **step-up authorization** flow for runtime `insufficient_scope` (403) errors; added **URL-mode elicitation** (SEP-1036) usable for sensitive auth flows.

> ⚠️ **Unsettled:** CIMD itself rests on an IETF *draft* (`draft-ietf-oauth-client-id-metadata-document`). Claude Code already supports it; most servers and other clients do not yet. Don't build *only* CIMD — but know DCR is now the legacy path, not the future.

### 1.3 Client support matrix (as of June 2026)

| Client | OAuth to remote MCP? | DCR (RFC 7591)? | CIMD? | Manual bearer / header? |
|---|---|---|---|---|
| **Claude Code (CLI)** | **Yes** — `/mcp` triggers browser OAuth on 401/403, auto RFC 9728 discovery, auto token refresh | **Yes** (default) | **Yes** (auto-discovered) | **Yes** — `--header "Authorization: Bearer …"`, `headers` in `.mcp.json`, dynamic `headersHelper` |
| **Cursor** | **Yes** — OAuth via **static client creds** in `mcp.json` (fixed redirect) | **No** — docs explicitly position static creds as the "provider doesn't support DCR" path | Not documented | **Yes** — `"headers": {"Authorization": "Bearer ${env:TOKEN}"}` |
| **VS Code (Copilot agent mode)** | **Yes** — auto browser OAuth when an `oauth` block is configured | Not documented | Not documented | **Yes** — `"headers"` + `${input:…}` / env vars |
| **Claude.ai web connectors** | **Yes** — OAuth in Settings → Connectors | DCR used for connectors; some hosts pinned to claude.ai's redirect | n/a | **Limited** — advanced settings historically expose OAuth client id/secret, **not** a raw bearer header (open gap, see below) |

**Practical pain points (primary-sourced):**
- **DCR gaps are real and now spec-acknowledged** — Cursor never implemented DCR; Claude Code surfaces an explicit "auth server does not support dynamic client registration" error. This is *why* the spec demoted DCR.
- **Claude.ai custom remote connectors couldn't accept a raw `Authorization: Bearer` header** — only OAuth client id/secret (user-reported gap, `anthropics/claude-ai-mcp#112`). ⚠️ *Flag: may have been resolved; verify before relying on a header path for Claude.ai.*
- **Token refresh in headless/CI** — the spec mandates short-lived access tokens + refresh rotation; browser-based OAuth breaks in headless contexts, which is precisely where a long-lived PAT shines.
- **Enterprise SSO** is handled by the resource-server model: point RFC 9728 `authorization_servers` at the customer IdP; `2025-11-25`'s OIDC discovery makes this interoperable. Claude Code exposes `authServerMetadataUrl` + scope pinning for security teams.

### 1.4 What the prompt-adjacent servers actually ship

| Server | Remote endpoint | Auth shipped |
|---|---|---|
| **Linear** | `https://mcp.linear.app/mcp` | **OAuth 2.1 + DCR**, **and** a direct fallback: *"supports passing OAuth token and API keys directly in the `Authorization: Bearer <token>` header."* |
| **Notion** | `https://mcp.notion.com/mcp` | OAuth 2.0 + PKCE + DCR (on Cloudflare `workers-oauth-provider`); **hosted endpoint does not accept bearer tokens**. Bearer fallback only via the now-unmaintained self-hosted `makenotion/notion-mcp-server`. |
| **Sentry** | `https://mcp.sentry.dev/mcp` | **OAuth only** on remote (dual-token design). **No API-token fallback on remote** — open feature request `getsentry/sentry-mcp#833`. Token (User Auth Token) works only in stdio/self-hosted mode. |

**Read-through:** the successful pattern that maximizes reach **and** satisfies headless/enterprise is **Linear's**: OAuth for interactive clients + a bearer/PAT fallback in the same header. Notion/Sentry chose OAuth-purity and pay for it with an open "let me just paste a token" request backlog.

### 1.5 ✅ Recommendation: auth for v1 + migration path

**v1 (ship now):**
1. **Accept `Authorization: Bearer <PAT>`** on the Streamable HTTP endpoint, validated against the PAT table you already plan. Scope PATs to the asset library (read; write later). This works *today* with Cursor, VS Code, and Claude Code (`--header`).
2. **Serve OAuth discovery as a forward-stub:** return `WWW-Authenticate` on 401 and host `/.well-known/oauth-protected-resource` (RFC 9728) describing the resource. Even if v1 only honors PATs, shipping the metadata endpoint means the OAuth upgrade is **purely additive** — no breaking change to the resource identity clients cache.
3. **stdio/local mode trusts the OS user** — read the PAT from an env var (e.g. `PROMPTATRIUM_TOKEN`), log only to stderr, never embed secrets.

**v2 (migration to OAuth 2.1, when client demand or enterprise SSO requires it):**
4. Stand up / co-host an authorization server (or front your existing session auth) issuing **short-lived access tokens + rotating refresh tokens**, audience-bound per RFC 8707.
5. Implement **CIMD (SHOULD)** and keep **DCR (MAY)** as the backwards-compat fallback — matching the `2025-11-25` priority order. Pre-registered client credentials path for Cursor (no DCR).
6. **Keep the PAT/bearer fallback permanently** (the Linear model) for headless/CI and clients that can't do OAuth. PATs and OAuth tokens both arrive as `Authorization: Bearer`; the validator just needs to recognize both shapes.

> Net: you get **maximum client reach on day one** with the PATs already on your roadmap, and the OAuth migration never breaks an existing integration because the resource-server metadata was there from the start.

---

## 2. Spec trajectory (what affects a *new* server)

### 2.1 Current revision and transport

- **Current published revision: `2025-11-25`** (supersedes `2025-06-18`; prior: `2025-03-26`, `2024-11-05`). Independently confirmed.
- **Streamable HTTP replaced HTTP+SSE in `2025-03-26`.** The old HTTP+SSE transport (from `2024-11-05`) is **deprecated**. ✅ **Build Streamable HTTP only**; implement HTTP+SSE *only* if you later need to support a long-tail legacy client (you don't, for the four targets).
- **stdio remains first-class** in `2025-11-25` — the spec defines exactly two standard transports (stdio + Streamable HTTP) and says clients *"SHOULD support stdio whenever possible."*
- Streamable HTTP server requirements that affect you: single endpoint path serving POST + GET; **MUST validate `Origin`** (return 403 on invalid, clarified in `2025-11-25`); clients send `MCP-Protocol-Version` header after init (since `2025-06-18`); optional `Mcp-Session-Id` for stateful sessions.

### 2.2 Primitive choice: Resources vs Tools vs Prompts

Spec definitions (`2025-11-25`):
- **Resources** = context data identified by URI, **application-driven** (host decides how to use). Support `mimeType`, `lastModified`, subscriptions, `listChanged`, pagination, and **resource templates** (RFC 6570 URIs).
- **Tools** = functions, **model-controlled** (the model decides to call them). Universally supported across clients.
- **Prompts** = templates, **user-controlled** (slash commands).

For **versioned text assets (rules/skills/prompts)**, **Resources are the correct primitive** — URI-addressable, `text/*` content, `lastModified` for versioning, `listChanged` for change notification, templates for `asset://{name}/{version}` addressing.

> ⚠️ **The historical "clients ignore resources" gap has largely — but unevenly — closed:**
> - **Claude Code:** full resource support via `@`-mentions (`@server:protocol://resource/path`); honors `list_changed`.
> - **VS Code/Copilot:** resources via "Add Context → MCP Resources" (`#` + URI); GA since VS Code 1.102.
> - **Cursor:** resources added in **v1.6 (Sept 2025)** — previously tools-only.
> - **Claude.ai / Desktop:** tools + prompts strong; standalone resource UX weaker than Claude Code's.
>
> **Therefore: hedge.** Serve assets as Resources **and** expose a retrieval **Tool** (e.g. `get_asset(name, version)`) that returns the same content — or a `resource_link` (added `2025-06-18`) — so model-driven pull works on every client while resource UX matures.

**Versioned delivery mechanisms (all optional server capabilities):** `resources/subscribe` → `notifications/resources/updated`; list-level `notifications/resources/list_changed`; `lastModified` annotations; pagination; resource templates.
- ✅ **Declare `listChanged`** — Claude Code honors it (dynamic updates without reconnect).
- ⚠️ **Per-resource `resources/subscribe` support is uneven** across clients — don't rely on `resources/updated` being acted on everywhere. Use `listChanged` + `lastModified` as the dependable versioning signal.

### 2.3 Elicitation

Introduced `2025-06-18`; `2025-11-25` added **two modes**: **form mode** (flat JSON-schema structured input; MUST NOT request secrets) and **URL mode** (out-of-band, for sensitive/auth flows). Claude Code supports **both** (with an `Elicitation` hook for auto-response); Cursor and VS Code support interactive elicitation (medium-confidence, secondary sources). Useful for PromptAtrium to, e.g., prompt the user to pick a target tool or confirm a destructive sync.

### 2.4 Skills-over-MCP: the emerging standard to align with

**SEP-2640 / `modelcontextprotocol/experimental-ext-skills`** proposes serving Anthropic Agent Skills through the **Resources** primitive with a `skill://<path>/SKILL.md` URI scheme (e.g. `skill://acme/billing/refunds/SKILL.md`), discoverable via `resources/list`, supporting nested namespaces, RBAC, multi-tenant, and version-adaptive content. ✅ **Align PromptAtrium's skill delivery with `skill://` + Resources** rather than bespoke tools — this future-proofs against the official direction and yields free client support as it lands. ⚠️ *Experimental working-group proposal, not yet merged into the core spec — track it.*

---

## 3. Distribution: one codebase, two modes

### 3.1 The SDK split is mid-flight — pin v1

⚠️ **Most important infra decision.** The official TypeScript SDK exists in two incompatible shapes as of June 2026:
- **v1 (stable, installable today):** single package `@modelcontextprotocol/sdk` with **subpath imports** (`/server/mcp.js`, `/server/stdio.js`, `/server/streamableHttp.js`); class `StreamableHTTPServerTransport`. This is what `^1.x` resolves to and what every working template uses.
- **v2 (on `main`, ~July 28 2026 target):** split into scoped packages (`@modelcontextprotocol/server`, `/client`, `/node`, `/express`, `/hono`); transport renamed `NodeStreamableHTTPServerTransport`; Express wiring behind `createMcpExpressApp`.

✅ **Build on v1 today, isolate all transport wiring in one module**, so the v2 migration is a one-file change. Don't adopt v2 pre-release.

### 3.2 The dual-transport pattern

- **One `McpServer`/core, two transports.** `server.connect(transport)` with whichever transport you instantiate; transport choice is a runtime branch, not a different server.
- **Lifecycle differs:** **stdio = one shared server instance** (single client). **HTTP = a fresh `McpServer` per session** via a factory — sharing one instance across HTTP sessions is a known footgun.
- **Stateful Streamable HTTP:** `transports` map keyed by `Mcp-Session-Id`, `sessionIdGenerator: () => randomUUID()`, `onsessioninitialized`/`onclose` to insert/delete; POST reuses or creates, GET (SSE) + DELETE share a session handler that 400s on unknown id.
- **Stateless mode** (`sessionIdGenerator: undefined`) is the serverless/edge option but loses SSE resumability + session-bound notifications.

### 3.3 Express 5 gotchas (this project is Express 5)

- **No wildcard routes** — Express 5's path-to-regexp throws on `'*'` / `'(.*)'`. You mostly only need the exact `/mcp` path; rewrite any catch-all (health, OAuth metadata, CORS preflight) to named params (`/{*splat}`) or explicit routes. *(Matches the existing `replit.md` gotcha — this codebase already follows the rule.)*
- **Mount on the existing app:** the transport consumes already-parsed `req`/`res`, so `express.json()` must run upstream, and POST/GET/DELETE all route to the same `/mcp` path.
- **Don't strip the `Accept` header** (`application/json, text/event-stream` drives content negotiation) and **flush SSE headers** before first write. *(Medium-confidence — general SSE/MCP guidance, not a single canonical doc.)*

### 3.4 `npx` distribution

- `package.json`: `"type": "module"`, `"bin": { "promptatrium-mcp": "dist/stdio.js" }`, `"files": ["dist"]`; the entry file starts with `#!/usr/bin/env node`.
- Clients invoke via `command: "npx", args: ["-y", "<pkg>"]` (the `-y` skips the install prompt for unattended use).
- **Shared auth across modes:** stdio trusts the local OS user (PAT via env var, stderr-only logs); remote applies bearer/OAuth middleware **only on the HTTP path**.

### 3.5 Framework?

`mcp-framework` (QuantGeekDev, ~921★, alive Apr 2026) adds auto-discovery + a `mcp create` CLI on top of the SDK — **convenience, not capability**. ✅ Given the imminent v2 split and that you already have `@workspace/asset-core`, **lean on the raw v1 SDK + your own thin template** to minimize migration risk. Frameworks lag SDK releases.

### 3.6 ✅ Recommended repo structure

Add a new workspace package (matches your `lib/*` + `artifacts/*` layout) that imports `@workspace/asset-core`:

```
artifacts/mcp-server/            # or lib/mcp-server — a thin front-end over @workspace/asset-core
  package.json                   # type:module; bin:{ "promptatrium-mcp":"dist/stdio.js" }; files:["dist"]
  src/
    core/
      server.ts                  # createMcpServer(ctx): registers resources/tools/prompts.
                                 #   Pure, transport-agnostic. Calls @workspace/asset-core
                                 #   to enumerate/emit assets. NO transport or auth here.
      resources.ts               # asset:// + skill:// resources, listChanged, templates
      tools.ts                   # get_asset / sync hedge tools (resource_link results)
      prompts.ts                 # user-invocable prompt assets (slash commands)
    transport/
      stdio.ts                   # #!/usr/bin/env node — one shared server, env-var PAT. bin target.
      http.ts                    # Express 5: /mcp POST+GET+DELETE, transports map,
                                 #   per-session createMcpServer() factory,
                                 #   bearer/PAT middleware + RFC 9728 metadata. HTTP path only.
    index.ts                     # branch on MCP_TRANSPORT=stdio|http
  scripts: { build, start:stdio, start:http }
```

Reference templates that implement exactly this branch: `cyanheads/mcp-ts-template` (`MCP_TRANSPORT_TYPE`), `alexanderop/mcp-server-starter-ts`. The hosted `http.ts` can mount into the existing `@workspace/api-server` Express app or run as its own container; either way the **core is the single source of truth** and both entrypoints import `createMcpServer()`.

---

## 4. Prior art — what to learn, what to differentiate

| Repo / product | Shape | Exposes | Transport / auth |
|---|---|---|---|
| **`minipuft/claude-prompts`** | Closest *conceptual* competitor | Compiles canonical prompts → **Claude Code skills + Cursor rules + OpenCode commands**, with drift detection (`skills:diff`, `skills-sync.yaml`) | stdio + streamable-http; local/file-based |
| **`sparesparrow/mcp-prompts`** | Closest *hosted/versioned* prior art | CRUD tools, prompt **versioning**, multi-storage (fs/S3/DynamoDB), RBAC + Stripe tiers | stdio + HTTP REST; Bearer / AWS IAM / Cognito |
| **`4regab/agent-rules-mcp`** | Rules server | `get_rules`, `list_rules` from a configurable GitHub repo | stdio; no auth |
| **`cremich/promptz-mcp`** (promptz.dev) | SaaS front-end | search/execute prompts + search/add/update **rules** | HTTPS; **API-key** auth |
| **`K-Dense-AI/claude-skills-mcp`** | Skills server (now unmaintained) | `find_helpful_skills`, `read_skill_document`, `list_skills` via vector search | stdio; no auth |
| **`langfuse/mcp-server-langfuse`** | Official hosted, in-platform | `getPrompt`, `createTextPrompt`, `updatePromptLabels`; versioning + prod labels | built-in `/api/public/mcp` streamable-HTTP |
| **Sync CLIs** (`agent-rules-sync`, `nicepkg/vsync`, `amtiYo/agents`, `cminn10/ecc2cursor`) | Non-MCP daemons | sync rules/skills/commands across Claude Code/Cursor/Gemini/Codex from one source | local-only, file-based, no hosted registry |
| **`@modelcontextprotocol/server-memory`, Mem0** | Adjacent (memory) | agent *runtime* memory, not curated assets | distinguish from — orthogonal |

**Learn:** adopt `minipuft`'s "author canonical → compile per-client → detect drift" workflow (it validates `@workspace/asset-core`'s adapter+manifest design); reuse `sparesparrow`/Langfuse's **version + label** model (production vs draft); the minimal **`list`/`get` two-tool** rules interface is proven; align skills with **SEP-2640 `skill://`**.

**Differentiate (the gap no one fills together):**
1. **Hosted, multi-tenant, versioned canonical registry** — sync CLIs are local/file-based; hosted servers cover only prompts.
2. **Unified model across all five asset kinds** (rule + skill + command + prompt + mcp-server) — every competitor covers a subset.
3. **True versioning + provenance** vs. frontmatter `version:` fields and timestamped-backup hacks.
4. **Hosted compilation + drift detection into both Claude Code *and* Cursor native formats** from one source of truth — `minipuft` does compilation locally; nobody ships it hosted for the full asset set.

---

## 5. Registry listing checklist (`registry.modelcontextprotocol.io`)

⚠️ **Status: preview, not GA** (launched 2025-09-08; data resets + breaking schema-date rolls expected before GA). Clients do **not** consume it directly yet — by design they consume downstream aggregators (e.g. the GitHub MCP Registry). So: **prepare a listing, but don't treat it as a distribution channel for v1.**

1. **Be public** — installable from a public registry (npm/PyPI/OCI/NuGet/mcpb) or a publicly reachable remote endpoint. No private servers.
2. **Publish the npm package first** (`npm publish --access public`); the registry stores **metadata only**.
3. **Add the ownership marker:** `"mcpName": "io.github.<org>/promptatrium"` in `package.json`, equal to `server.json` `name`.
4. **Pick a provable namespace:** GitHub (`io.github.<org>/<name>`) via OAuth device flow, **or** reverse-DNS domain (`io.promptatrium/<name>`) via DNS TXT (`v=MCPv1; k=ed25519; p=<pubkey>`) or `/.well-known/mcp-registry-auth` HTTP challenge.
5. **Create `server.json`** (`mcp-publisher init`): required `name` (`^[a-zA-Z0-9.-]+/[a-zA-Z0-9._-]+$`, 3–200 chars), `description`, `version` (semver); plus `$schema: https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json`, `repository`, `packages` (each: `registryType` npm/pypi/oci/nuget/mcpb + `identifier` + `transport` stdio|streamable-http), and/or `remotes` (`type` streamable-http|sse + URL).
6. **Install CLI:** `brew install mcp-publisher` (or release tarball).
7. **Authenticate to the namespace:** `mcp-publisher login github` (or `login dns` / `login http`).
8. **Publish:** `mcp-publisher publish`; verify `curl "https://registry.modelcontextprotocol.io/v0.1/servers?search=promptatrium"`.
9. **Updates:** bump `version` in both package and `server.json`, re-publish.
10. **Keep names/descriptions clean** (anti-spam takedown policy applies).

⚠️ Two minor unsettled schema points to re-verify against the live repo before publishing: whether `cargo` is in the `registryType` enum (markdown ref says yes; the schema excerpt did not list it), and the API path (`v0` vs `v0.1`).

---

## 6. Spec-level risks (with dates)

| Risk | Date | Impact on PromptAtrium | Mitigation |
|---|---|---|---|
| **Stateless-core "next" spec** — roadmap targets removing the `initialize`/`initialized` handshake + `Mcp-Session-Id`, moving client info into `_meta`, adding `ttlMs`/`cacheScope` cache hints. | Planned **~2026-07-28** (the SDK-v2 stable target corroborates this date from the typescript-sdk repo). ⚠️ **The specific RC blog post is future-dated relative to today (2026-06-12) — treat its details as planned, not final/verified.** | A server built on `2025-11-25` stateful sessions faces a migration. | **Design stateless-friendly now:** don't hard-depend on `Mcp-Session-Id` or long-held SSE streams; keep request handling instance-independent. Stateless Streamable HTTP mode already gets you most of the way. |
| **SDK v1 → v2 package split** (`@modelcontextprotocol/sdk` → scoped `@modelcontextprotocol/server` + `/express`; `StreamableHTTPServerTransport` → `NodeStreamableHTTPServerTransport`). | v2 on `main`; ~**2026-07-28** target. | Import paths + transport class names change. | Pin **v1** (`^1.x`), isolate transport wiring in `src/transport/`. Migration = one file. |
| **DCR → MAY, CIMD → SHOULD.** DCR is now the legacy registration path. | `2025-11-25` | If you build OAuth around DCR only, you're on the deprecated path; CIMD adoption is still early. | Support pre-registered creds + CIMD + DCR fallback (the spec's priority order). Keep the PAT/bearer fallback permanently. |
| **CIMD rests on an IETF draft.** | draft, 2025–26 | The recommended mechanism could still shift. | Don't make CIMD the *only* path; PAT fallback insulates you. |
| **Resource-primitive UX uneven across clients** (Cursor only added resources v1.6 / Sept 2025; Claude.ai weaker). | Sept 2025 → ongoing | Resource-only delivery may not surface in every client. | Expose a retrieval **Tool** alongside Resources (tools are universal); use `resource_link` results. |
| **`resources/subscribe` honored inconsistently.** | ongoing | Push-style version notifications unreliable. | Rely on `listChanged` + `lastModified`; treat per-resource subscriptions as best-effort. |
| **SEP-2640 `skill://` is experimental**, not in core spec. | WG proposal, 2026 | The skill URI scheme could change before standardization. | Align to it but keep the canonical mapping in `@workspace/asset-core` so a scheme change is an adapter edit. |
| **Official registry is preview**, data resets + schema-date rolls expected; clients don't consume it directly yet. | preview since 2025-09-08, no GA | Don't depend on it for v1 distribution. | Ship via `npx` + hosted URL; reserve the namespace; publish when GA firms up. |
| **Claude.ai custom connector header gap** (`#112`) — couldn't paste a raw bearer header. | reported; status unconfirmed | Claude.ai web users may not be able to use a PAT directly. | Verify current status; offer OAuth connector path for Claude.ai specifically. |

---

## 7. Sources (primary)

**Spec & changelogs**
- https://modelcontextprotocol.io/specification/versioning (current = 2025-11-25)
- https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization
- https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization
- https://modelcontextprotocol.io/specification/2025-11-25/changelog
- https://modelcontextprotocol.io/specification/2025-06-18/changelog
- https://modelcontextprotocol.io/specification/2025-03-26/basic/transports (Streamable HTTP replaces HTTP+SSE)
- https://modelcontextprotocol.io/specification/2025-11-25/server/resources
- https://modelcontextprotocol.io/specification/2025-11-25/server/tools
- https://modelcontextprotocol.io/specification/2025-11-25/server/prompts
- https://modelcontextprotocol.io/specification/2025-11-25/client/elicitation
- https://modelcontextprotocol.io/specification/2025-11-25/server/utilities/pagination
- https://blog.modelcontextprotocol.io/posts/2026-07-28-release-candidate/ ⚠️ *future-dated — planned, not verified*
- https://blog.modelcontextprotocol.io/posts/2026-mcp-roadmap/

**Clients**
- https://code.claude.com/docs/en/mcp
- https://cursor.com/docs/context/mcp · https://cursor.com/docs/mcp
- https://code.visualstudio.com/docs/copilot/reference/mcp-configuration · https://code.visualstudio.com/docs/agent-customization/mcp-servers
- https://claude.ai/customize/connectors · https://github.com/anthropics/claude-ai-mcp/issues/112

**Production servers (auth)**
- https://linear.app/docs/mcp
- https://developers.notion.com/guides/mcp/build-mcp-client · https://github.com/makenotion/notion-mcp-server
- https://github.com/getsentry/sentry-mcp · https://github.com/getsentry/sentry-mcp/issues/833 · https://mcp.sentry.dev/

**SDK / dual-mode distribution**
- https://github.com/modelcontextprotocol/typescript-sdk · /blob/main/docs/server.md · /blob/main/examples/server/src/simpleStreamableHttp.ts
- https://ts.sdk.modelcontextprotocol.io/documents/server.html
- https://modelcontextprotocol.io/docs/develop/build-server
- https://github.com/cyanheads/mcp-ts-template · https://github.com/alexanderop/mcp-server-starter-ts
- https://github.com/QuantGeekDev/mcp-framework
- https://github.com/expressjs/express/issues/6468 · https://expressjs.com/en/api/

**Registry**
- https://blog.modelcontextprotocol.io/posts/2025-09-08-mcp-registry-preview/
- https://modelcontextprotocol.io/registry/about · /quickstart · /authentication · /moderation-policy
- https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json
- https://github.com/modelcontextprotocol/registry

**Prior art**
- https://github.com/minipuft/claude-prompts · https://github.com/sparesparrow/mcp-prompts
- https://github.com/4regab/agent-rules-mcp · https://github.com/cremich/promptz-mcp (promptz.dev)
- https://github.com/K-Dense-AI/claude-skills-mcp
- https://github.com/modelcontextprotocol/experimental-ext-skills · /blob/main/docs/skill-uri-scheme.md · https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2640 (SEP-2640)
- https://langfuse.com/docs/prompt-management/features/mcp-server · https://github.com/langfuse/mcp-server-langfuse
- https://github.com/dhruv-anand-aintech/agent-rules-sync · https://github.com/nicepkg/vsync · https://github.com/amtiYo/agents · https://github.com/cminn10/ecc2cursor
- https://github.com/modelcontextprotocol/servers/tree/main/src/memory
