# PromptAtrium Mobile CRUD + Shared Component Library

## What & Why
Users can currently browse and save public prompts on PromptAtrium Mobile, but cannot create, edit, or delete their own prompts. This task adds full CRUD for the authenticated user's prompt library, and extracts the reusable UI components into a shared `lib/prompt-crud` package so PromptAtriumLite can adopt the same screens without duplicating code.

## Done looks like
- PromptAtrium Mobile has a "My Prompts" section where logged-in users can see all their prompts
- Users can create a new prompt (name, content, tags, type, visibility) from the mobile app
- Users can edit any of their own prompts
- Users can delete their own prompts (with confirmation)
- A `lib/prompt-crud` workspace package exists with shared, server-agnostic components: PromptForm, PromptListItem, TagInput, SearchBar, and a `usePromptCrud` hook that accepts a storage adapter (server API or AsyncStorage) — this is what PromptAtriumLite will plug its local storage into
- Web app prompt CRUD API endpoints used by mobile are confirmed working (create, update, delete under existing auth routes — no new backend work expected)
- Typecheck passes across lib/prompt-crud, prompt-atrium-mobile

## Out of scope
- PromptAtriumLite (separate task, depends on this one)
- Community sharing or publishing from mobile
- Image/example image upload from mobile
- Bulk operations

## Steps
1. **Audit existing API routes** — Confirm which prompt CRUD endpoints already exist (POST /api/objects/prompts, PUT /api/objects/prompts/:id, DELETE /api/objects/prompts/:id) and that they're properly authenticated. Note any missing routes.
2. **Create lib/prompt-crud package** — Scaffold a new `lib/prompt-crud` workspace package (TypeScript, React Native compatible). Implement a storage adapter interface: `PromptCrudAdapter` with `list`, `get`, `create`, `update`, `delete` methods. Implement a `ServerAdapter` that calls the existing authenticated API endpoints.
3. **Shared UI components** — Build inside lib/prompt-crud: `PromptForm` (name, content, tags, type selector, visibility toggle), `PromptListItem` (compact card with edit/delete actions), `TagInput`, `SearchBar`. Components must be React Native (no web-only APIs).
4. **usePromptCrud hook** — A hook that accepts a `PromptCrudAdapter` and returns the full CRUD state (list, loading, error) and action methods. This is what both apps will call.
5. **My Prompts tab/screen in PromptAtrium Mobile** — Add a "My Prompts" tab (or section within the existing Library tab) that uses `usePromptCrud` with the `ServerAdapter`. Shows the user's prompts with search, filtered by ownership.
6. **Create/Edit screen** — Add a create prompt screen and an edit screen (pre-populated from the selected prompt) using `PromptForm`. On save, calls the server API via `ServerAdapter`. Navigate back on success.
7. **Delete flow** — Swipe-to-delete or long-press on PromptListItem triggers a confirmation alert; on confirm, calls delete via the adapter.
8. **Verify** — Typecheck passes; smoke test create/edit/delete on the Expo preview; confirm the lib/prompt-crud package typechecks independently.

## Relevant files
- `artifacts/prompt-atrium-mobile/app/(tabs)/`
- `artifacts/prompt-atrium-mobile/lib/api.ts`
- `artifacts/prompt-atrium-mobile/lib/saved.tsx`
- `artifacts/prompt-atrium-mobile/components/PromptCard.tsx`
- `artifacts/api-server/src/legacyRoutes.ts`
- `lib/db/src/schema/schema.ts:466-528`
- `pnpm-workspace.yaml`
