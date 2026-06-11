# PromptAtriumLite Mobile App

## What & Why
A standalone personal prompt library app — no account, no server sync, no communities. Two audiences: people who want a private prompt utility without signing up, and a stepping stone to encourage upgrade to the full PromptAtrium Mobile app.

The app is entirely local-first (AsyncStorage) with one outward-facing connection: a read-only "Discover" tab that pulls a small curated set of public prompts from the server (no auth required) so users can preview and save them locally.

## Done looks like
- New "PromptAtriumLite" Expo app registered as its own artifact, accessible in the preview pane
- Full local prompt library: create, edit, delete, search, and tag prompts stored on-device
- Discover tab showing prompts flagged `is_lite_featured` on the server — user can one-tap save any to their local library
- Upgrade teaser section (locked cards) showing prompts flagged `is_lite_preview` with a "Get PromptAtrium Mobile" nudge
- AI Tools tab with the same five no-auth tools already in PromptAtrium Mobile (Generate Prompt, PromptMiner, Metadata Analyzer, Prompting Guides, Import Prompts)
- Import/Export: save local library to JSON file; import from JSON/JSONL
- A reusable prompt CRUD component library extracted to `lib/prompt-crud` so PromptAtrium Mobile can adopt the same screens without duplicating code
- `is_lite_featured` and `is_lite_preview` boolean columns added to the `prompts` table in both dev and production databases via raw SQL (not db:push)
- A public `/api/objects/prompts/lite-featured` endpoint (or query param) returning the curated set without auth

## Out of scope
- Auth, user accounts, or any server-side write operations
- Communities, sharing, or posting prompts
- Multi-device sync
- In-app purchases or marketplace
- PromptAtrium Mobile CRUD screens (those adopt `lib/prompt-crud` in a separate follow-up task)
- Schema reconciliation / legacy column cleanup (separate future task)

## Steps
1. **Schema additions** — Add `is_lite_featured boolean DEFAULT false` and `is_lite_preview boolean DEFAULT false` to the `prompts` table via raw `ALTER TABLE` SQL in both dev and production databases. Add a partial index on each column.
2. **Backend API** — Add a public (no-auth) endpoint that returns prompts where `is_lite_featured = true`, and a separate one for `is_lite_preview = true`. Both apply the existing public-prompt filters (isPublic, not hidden, not NSFW). Seed a handful of existing public prompts as featured/preview by flipping their flags.
3. **Shared CRUD lib** — Create `lib/prompt-crud` with typed AsyncStorage helpers and React Native UI components: PromptForm (create/edit), PromptListItem, TagInput, SearchBar, and a `useCrudPrompts` hook. No server calls — purely local.
4. **New Expo artifact** — Scaffold `artifacts/prompt-atrium-lite` using the existing mobile app as a template. Register it with its own workflow and preview path. Strip out all server-browsing screens; keep only the tab shell and shared utilities (colors, API base, Markdown component).
5. **Local library tab** — Wire up the shared CRUD lib: prompt list with search/filter, tap-to-view detail, swipe-to-delete, create/edit form with tags. All data lives in AsyncStorage under a `lite_prompts` key.
6. **Discover tab** — Fetch the `is_lite_featured` prompts from the new public endpoint. Display as cards with a "Save to My Library" button. Below the featured set, show `is_lite_preview` prompts as blurred/locked cards with an upgrade nudge.
7. **AI Tools tab** — Copy the five tool screens and their shared utilities verbatim from `artifacts/prompt-atrium-mobile`. Tools call the same public API endpoints; no changes needed server-side.
8. **Import / Export** — Export the full local library as a JSON file via `expo-sharing`. Import from a JSON/JSONL file using `expo-document-picker` (already a dependency in the existing mobile app).
9. **Verify** — Typecheck passes; smoke-test all tabs in the Expo preview; confirm Discover tab loads featured prompts and saves them to the local library.

## Relevant files
- `artifacts/prompt-atrium-mobile/app/(tabs)/tools.tsx`
- `artifacts/prompt-atrium-mobile/app/tools/`
- `artifacts/prompt-atrium-mobile/lib/api.ts`
- `artifacts/prompt-atrium-mobile/lib/saved.tsx`
- `artifacts/prompt-atrium-mobile/lib/local.ts`
- `artifacts/prompt-atrium-mobile/components/PromptCard.tsx`
- `artifacts/prompt-atrium-mobile/components/ExampleImages.tsx`
- `artifacts/prompt-atrium-mobile/constants/colors.ts`
- `artifacts/api-server/src/legacyRoutes.ts`
- `lib/db/src/schema/schema.ts:466-528`
