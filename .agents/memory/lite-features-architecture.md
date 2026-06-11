---
name: Lite features architecture
description: Why "Lite" (curated/teaser + local CRUD) lives inside the main mobile app, and how to seed curated rows in prod.
---

# Lite features live INSIDE the main mobile app

"Lite" (curated discovery, locked teaser cards, and a personal prompt library
with create/edit/delete) is folded directly into `artifacts/prompt-atrium-mobile`.
There is NO separate "Lite" Expo app.

**Why:** the platform allows only ONE mobile app per project, and the user
explicitly chose to fold Lite into the existing mobile app rather than ship a
second artifact.

# The mobile app deliberately does NOT consume `lib/prompt-crud`

A shared `lib/prompt-crud` package exists (LocalAdapter/ServerAdapter +
usePromptCrud + RN components), but the mobile app does not import it.

**Why:** Architect "Option B" — extend the app's existing `SavedProvider`
(`lib/saved.tsx`) in place instead of bolting on a second storage/CRUD layer.
The personal library is local-only (AsyncStorage via SavedProvider); the mobile
app makes NO server writes. Locally-created prompts carry a `local-` id
(`lib/local.ts` `makeLocalPrompt`) and are read from the saved store, not the
network. Only `local-` prompts are editable; server prompts are read-only.

**How to apply:** if asked to add prompt CRUD to the mobile app, extend
SavedProvider — do not wire in `lib/prompt-crud`. `lib/prompt-crud` is for other
(future/auth-backed) consumers.

# Curated/teaser data + prod seeding

Curated home rows come from public, no-auth endpoints `/api/lite/featured` and
`/api/lite/preview`, driven by `is_lite_featured` / `is_lite_preview` boolean
flags on `prompts` (server already filters to public, non-hidden, non-NSFW).

**Prod seeding after publish:** re-Publishing pushes SCHEMA only, never data. To
populate curated rows in prod, call the super-admin endpoint
`POST /api/admin/lite/seed` (auth required) after publishing — dev seeding does
not reach prod.
