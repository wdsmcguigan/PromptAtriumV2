# PromptAtrium

An AI prompt library and community platform for managing, sharing, and refining AI prompts.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at `/api`)
- `pnpm --filter @workspace/prompt-atrium run dev` — run the frontend (Vite, proxied at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only — see Gotchas)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- Frontend: React + Vite + Tailwind CSS v3
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/api-server/src/legacyRoutes.ts` — all backend routes (migrated from Express 4 monolith)
- `artifacts/api-server/src/index.ts` — server entry, registers routes + starts listening
- `lib/db/src/schema/schema.ts` — source of truth for DB schema and Drizzle types
- `artifacts/prompt-atrium/src/` — React frontend (pages, components, hooks)
- `artifacts/prompt-atrium/vite.config.ts` — Vite config; `@shared` alias → `lib/db/src/schema`

## Architecture decisions

- **Skipped OpenAPI codegen** — legacy app has 7,000+ line route file; kept existing `apiRequest` fetch layer rather than generating hooks.
- **`@shared/*` alias** — both Vite and tsconfig alias `@shared/` → `lib/db/src/schema/` so 66+ frontend files that import shared types continue to work.
- **Express 5 wildcard routes** — legacy `:param(*)` and `:param(.*)` patterns replaced with named wildcards (`/*name`). Handlers use `req.path` instead of `req.params`.
- **DB constraints via raw SQL** — `drizzle-kit push` requires TTY for safety prompts; unique constraints added via `executeSql` directly to avoid data loss from interactive prompts.
- **No `memoizee` dependency** — replaced with inline TTL cache in `replitAuth.ts`; `es5-ext` is firewall-blocked.

## Product

PromptAtrium is a community platform where users can manage, share, and refine AI prompts. Features include a prompt library, community sharing, collections, a marketplace, codex/glossary, credits system, and AI-powered prompt refinement tools.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- **`pnpm --filter @workspace/db run push` warns about DATA LOSS** — the live DB has extra tables/columns (agent_profiles, prompt_generator_components, workflow_missions, workflow_steps, plus extra columns on several tables) that are not in `schema.ts`. Never confirm the destructive push. Add missing constraints/indexes via raw SQL instead.
- **Express 5 route syntax** — never use `:param(*)` or `:param(.*)`. Use `/*name` for named wildcards; access via `req.path` in handlers.
- **WebGL errors in preview** — Three.js particle system fails in the sandboxed preview (no GPU). This is expected in development and does not affect production.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
