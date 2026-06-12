# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Dev servers
pnpm --filter @workspace/api-server run dev       # API server on port 8080 (proxied at /api)
pnpm --filter @workspace/prompt-atrium run dev    # Frontend via Vite (proxied at /)

# Type checking & build
pnpm run typecheck                                 # Full typecheck across all workspace packages
pnpm run typecheck:libs                            # Typecheck shared libs only
pnpm run build                                     # Typecheck + build all packages

# Database
pnpm --filter @workspace/db run push               # Push schema changes — read Gotchas first
pnpm --filter @workspace/db run push-force         # Force push (destructive — never use on production)
```

Required env: `DATABASE_URL` (Postgres connection string).

## Architecture

pnpm monorepo with two main layers:

**`lib/` — shared workspace packages**
- `lib/db/src/schema/schema.ts` — source of truth for all DB types (Drizzle ORM + drizzle-zod)
- `lib/api-zod/` — exported Zod validation schemas
- `lib/api-client-react/` — React Query hooks wrapping API calls
- `lib/prompt-crud/` — shared prompt business logic used by web + mobile

**`artifacts/` — deployable apps**
- `artifacts/api-server/src/legacyRoutes.ts` — all Express routes (~7,000 lines; migrated from Express 4 monolith)
- `artifacts/api-server/src/index.ts` — server entry, registers routes + middleware
- `artifacts/prompt-atrium/src/` — React 19 SPA (pages, components, hooks)
- `artifacts/prompt-atrium-mobile/` — React Native / Expo app

**`@shared/*` alias** — both Vite (`vite.config.ts`) and tsconfig alias `@shared/` → `lib/db/src/schema/`. 66+ files use this; don't break the alias or move schema files without updating both configs.

## Key Decisions

- **No OpenAPI codegen** — the 7,000-line route file predates the OpenAPI spec. Frontend uses a hand-rolled `apiRequest` fetch layer rather than generated hooks.
- **Express 5 wildcard syntax** — never write `:param(*)` or `:param(.*)`. Use `/*name` for named wildcards and access the value via `req.path` in handlers.
- **DB constraints via raw SQL** — `drizzle-kit push` requires an interactive TTY for safety prompts. Add unique constraints / indexes using `executeSql` directly rather than modifying schema and pushing.
- **No `memoizee`** — `es5-ext` is firewall-blocked. Inline TTL cache is used in `replitAuth.ts` instead.
- **Three.js WebGL** — particle effects fail in sandboxed preview (no GPU). Expected in dev; not a bug.

## Gotchas

- **Never confirm a destructive `db push`** — the live DB has extra tables and columns (`agent_profiles`, `prompt_generator_components`, `workflow_missions`, `workflow_steps`, plus extra columns on several tables) that are not in `schema.ts`. A destructive push will drop them.
- **Zod v4 import** — import from `zod/v4`, not bare `zod`.
- **esbuild CJS bundle** — the API server is bundled to CommonJS via `artifacts/api-server/build.mjs`; don't introduce ESM-only imports in server code without verifying esbuild can handle them.
