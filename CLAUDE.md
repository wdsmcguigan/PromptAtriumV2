# PromptAtrium

An AI prompt library and community platform for managing, sharing, and refining AI prompts.

## Run & Operate

- `pnpm install` — install all workspace dependencies (pnpm only; npm/yarn are blocked)
- `pnpm --filter @workspace/api-server run dev` — run the API server (default port 8080)
- `pnpm --filter @workspace/prompt-atrium run dev` — run the frontend (Vite, default port 5173, proxies `/api` and `/objects` to port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only — see Gotchas)
- Copy `.env.example` to `.env` and fill in values; `DATABASE_URL`, `SESSION_SECRET`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET` are required (plus `APP_URL` in production)

## Stack

- pnpm workspaces, Node.js >= 22, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM (node-postgres driver)
- Auth: generic OIDC via openid-client + passport (Google by default; see AUTH_SETUP.md)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- Frontend: React + Vite + Tailwind CSS v3
- Object storage: Google Cloud Storage (`GOOGLE_SERVICE_ACCOUNT_KEY` or Application Default Credentials)
- Build: esbuild (ESM bundle) for the server, Vite for the frontend

## Where things live

- `artifacts/api-server/src/legacyRoutes.ts` — all backend routes (migrated from Express 4 monolith, ~8k lines)
- `artifacts/api-server/src/index.ts` — server entry: routes, static serving (prod), graceful shutdown
- `artifacts/api-server/src/auth.ts` — OIDC auth; session shape is `{ claims: { sub: <users.id> }, expires_at }` and ~135 call sites read `req.user.claims.sub` as the DB user id
- `lib/db/src/schema/schema.ts` — source of truth for DB schema and Drizzle types
- `artifacts/prompt-atrium/src/` — React frontend (pages, components, hooks)
- `artifacts/prompt-atrium/vite.config.ts` — Vite config; `@shared` alias → `lib/db/src/schema`
- `artifacts/prompt-atrium-mobile/` — Expo mobile app (PromptAtriumLite)
- `.migration-backup/` — frozen pre-monorepo snapshot of the original Replit code; reference only

## Architecture decisions

- **Auth identity continuity** — users are matched by verified email (case-insensitive), never by the provider's `sub`. Replit-era `users.id` values stay intact so prompts/orders/ledger rows stay attached. Provider profile data only fills empty fields. Don't weaken this in `auth.ts` / `findOrCreateUser`.
- **`@shared/*` alias** — both Vite and tsconfig alias `@shared/` → `lib/db/src/schema/` so 66+ frontend files that import shared types continue to work.
- **Express 5 wildcard routes** — legacy `:param(*)` and `:param(.*)` patterns replaced with named wildcards (`/*name`). Handlers use `req.path` instead of `req.params`.
- **DB constraints via raw SQL** — `drizzle-kit push` requires TTY for safety prompts; unique constraints added via raw SQL directly to avoid data loss from interactive prompts.
- **Production serving** — the API server serves the built SPA (`STATIC_DIR`, default `dist/public` next to the server bundle); in dev, Vite proxies to the API.
- **Lazy AI clients** — OpenAI/Gemini clients are constructed lazily inside handlers so missing API keys disable features instead of crashing the server at boot.

## Product

PromptAtrium is "the home for your AI working set" — a library and community for prompts in the umbrella sense: prompts, system prompts, skills, rules, and workflows. It serves beginners (browse/copy/grow) through professionals (versioned assets synced into tools via MCP/CLI — in progress). Features today: prompt library, community sharing, collections, codex/glossary, gamification credits, and AI-powered prompt refinement. The marketplace experiment was removed entirely (commit history has it if ever needed).

## Gotchas

- **`pnpm --filter @workspace/db run push` warns about DATA LOSS** — the live DB has extra tables/columns (agent_profiles, prompt_generator_components, workflow_missions, workflow_steps, plus extra columns on several tables) that are not in `schema.ts`. Never confirm the destructive push. Add missing constraints/indexes via raw SQL instead.
- **Express 5 route syntax** — never use `:param(*)` or `:param(.*)`. Use `/*name` for named wildcards; access via `req.path` in handlers.
- **WebGL errors in headless preview** — Three.js particle system fails without a GPU. Expected in sandboxed dev environments; does not affect production.
- **Health checks** — `GET /api/health` probes the DB (readiness); `GET /api/healthz` is liveness only. Both are registered before the session middleware so probes never create sessions.
