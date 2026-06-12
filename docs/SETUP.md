# PromptAtrium — Setup & Deployment

This app runs anywhere Node 22+ and PostgreSQL are available. It was migrated
off the Replit ecosystem; nothing in the runtime depends on Replit services.

## Local development

```bash
pnpm install
cp .env.example .env        # fill in DATABASE_URL, SESSION_SECRET, OIDC_*
pnpm --filter @workspace/db run push    # create schema on a fresh DB (dev only)

# Terminal 1 — API server on :8080
pnpm --filter @workspace/api-server run dev

# Terminal 2 — frontend on :5173 (proxies /api and /objects to :8080)
pnpm --filter @workspace/prompt-atrium run dev
```

Open http://localhost:5173. The Vite dev server proxies API calls; in
production the API server serves the built SPA itself.

## Google OAuth (login)

1. Google Cloud Console → APIs & Services → Credentials → Create OAuth client ID
   (type: Web application).
2. Authorized redirect URI: `<APP_URL>/api/callback`
   (for local dev: `http://localhost:8080/api/callback` — note the API port,
   not the Vite port, unless you set `APP_URL` to the Vite origin).
3. Set `OIDC_CLIENT_ID` and `OIDC_CLIENT_SECRET` in `.env`.

Any OIDC provider works — set `OIDC_ISSUER_URL` to its issuer (defaults to
`https://accounts.google.com`).

**Identity continuity:** users are matched by verified email
(case-insensitive), never by the provider subject. Existing users keep their
ids — prompts, orders, and ledger rows stay attached. Provider profile data
only fills empty fields.

## Object storage (Google Cloud Storage)

1. Create a GCS bucket; create a service account with `Storage Object Admin`
   on that bucket.
2. Provide credentials either as `GOOGLE_SERVICE_ACCOUNT_KEY` (inline JSON) or
   `GOOGLE_APPLICATION_CREDENTIALS` (key file path / workload identity).
3. Set `PUBLIC_OBJECT_SEARCH_PATHS=/<bucket>/public` and
   `PRIVATE_OBJECT_DIR=/<bucket>/.private` (same path format the Replit-era
   data used, so existing `/objects/...` references in the DB keep working).

In development without GCS credentials, uploads fall back to a local
`server/uploads` directory automatically.

## Production deployment

The Dockerfile builds the frontend + API and serves both from one container
on port 8080 (`GET /api/health` is the readiness probe — it checks the DB).

```bash
docker build -t promptatrium .
docker run -p 8080:8080 --env-file .env promptatrium
```

Required in production: `DATABASE_URL`, `SESSION_SECRET` (32+ chars),
`OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, `APP_URL` (public URL; the OAuth
callback and Open Graph tags derive from it). The server exits at boot if
these are missing.

Works as-is on Railway, Render, Fly.io, Cloud Run, or any Docker host.
Sessions live in Postgres (the `sessions` table), so multiple instances are
fine behind a load balancer.

### Database

Any PostgreSQL 14+ works (Neon, Supabase, RDS, self-hosted). The server uses
the standard `pg` driver over TCP. To migrate data off Replit's built-in DB:

```bash
pg_dump "$REPLIT_DATABASE_URL" --no-owner --no-privileges -Fc -f promptatrium.dump
pg_restore -d "$NEW_DATABASE_URL" --no-owner promptatrium.dump
```

### Stripe / PayPal webhooks

After deploying, point webhook endpoints at
`<APP_URL>/api/webhooks/stripe` and `<APP_URL>/api/webhooks/paypal`
and set the corresponding secrets. (The marketplace feature is currently
flagged off; webhooks are still registered so payment lifecycle events are
not lost.)
