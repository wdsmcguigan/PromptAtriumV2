# Surfaces & serving map

> The canonical inventory of every entry point PromptAtrium serves or intends
> to serve, and how each is fed. Update when a surface lands, gets planned, or
> gets cut. Vision source: "the GitHub of prompts & context injection" — one
> asset store, many faces, from Google-Keep-easy to CLI-professional.

## Surfaces

| # | Surface | Audience | Status | Served by |
|---|---------|----------|--------|-----------|
| 1 | Web app (SPA) | beginners → pros | **LIVE** (legacy version, Replit) / **BUILT** (this repo, undeployed) | API server serves the built SPA; legacy `/api/*` + v2 `/api/v2/*` |
| 2 | Mobile app (Expo "Lite") | beginners/enthusiasts | **BUILT/partial** (plans 27, 29) | public API endpoints, local-first CRUD |
| 3 | MCP server — hosted | pros, agents | **BUILT** (PR #20, undeployed) | Streamable HTTP `/mcp` mounted in api-server; PAT bearer; wraps `/api/v2` |
| 4 | MCP server — local `npx` stdio | pros, agents | **BUILT** (PR #20) | same core; `PROMPTATRIUM_TOKEN` → `/api/v2` over HTTPS |
| 5 | CLI | pros | **PLANNED** | `@workspace/asset-core` sync engine (plan 30) + `/api/v2` |
| 6 | Per-tool sync adapters (Claude Code, Cursor; then Copilot/Codex/Windsurf) | pros | **PLANNED** (plan 30) | asset-core emit/parse, driven by CLI and/or MCP |
| 7 | Browser extension (right-click prompt/context insert) | everyone | **ASPIRATIONAL** (no plan # yet) | public read API for public assets; PAT for the user's library; cacheable immutable reads |
| 8 | OS-native right-click / share-sheet integrations | everyone | **ASPIRATIONAL** | same read paths as #7 |
| 9 | Registry syndication (official MCP registry, Glama, PulseMCP, mcp.so, Smithery) + open-sourced server package | distribution | **PLANNED** (GTM playbook; `server.json` ready in #20) | pointers to the hosted endpoint — pollen, never writes back |
| 10 | Media-gen prompt surfaces (image/video prompt workflows) | enthusiasts | **ASPIRATIONAL** | snapshot-class assets via the same APIs; results in `asset_results` |
| 11 | Hub-wrapper seeding (curated mirror of established hubs) | bootstrap strategy | **IN PROGRESS** | the harvest pipeline (PR-gated corpus → `import:seed` → v2 assets owned by `promptatrium`) |

## Serving map

```
clients:  SPA · Expo · MCP (hosted+stdio) · CLI · extensions · registries
              │
              ▼
edge:     Cloudflare DNS → (future) CDN cache of public immutable content
              │
              ▼
app:      one Node container (Railway): Express 5
            ├─ serves built SPA
            ├─ /api/*      legacy routes (sessions, OIDC Google login)
            ├─ /api/v2/*   asset store (session OR pat_ bearer; scopes)
            └─ /mcp        Streamable HTTP (mount deliberate, off by default)
              │
              ▼
data:     Neon Postgres (legacy schema + v2 schema, one DB)
          GCS bucket (objects/images; owned, not Replit-managed — at cutover)
```

## The invariant underneath (why this scales without exotic infra)

- **Every surface is a client of the same small API.** New endpoints multiply
  clients, not infrastructure.
- **The hot path at scale is reads of public, immutable, versioned content** —
  exactly what CDNs cache perfectly. Edge caching is the scaling story; the
  core stays boring and portable (see `.agents/memory/replit-exit.md`).
- **Write paths stay narrow**: user CRUD through the API; the public corpus
  only through the PR-gated pipeline (agent-roles.md invariant 1). Marketing/
  syndication surfaces consume exports and never write (pollen rule).
- Auth tiers map to surfaces: anonymous (public reads) → session (web) →
  PAT scopes (MCP/CLI/extension) → OAuth later (Claude.ai connector, per
  phase-2 plan).
