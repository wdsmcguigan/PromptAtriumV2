---
name: Mobile companion public-API gotchas
description: Backend behaviors and a CORS gotcha that shaped the public-browse Expo companion; relevant to any unauthenticated client of this API.
---

# Public-browse mobile companion vs the PromptAtrium API

The Expo mobile artifact is a PUBLIC-browse-first companion (no auth) because the
web app's auth is cookie-session Replit Auth, which a native client can't mirror.
Several server behaviors only become visible from an unauthenticated client:

- **CORS + credentials are incompatible here.** The API uses wildcard `cors()`
  (`Access-Control-Allow-Origin: *`). Sending `credentials: "include"` from the
  Expo *web* build is rejected by the browser ("wildcard not allowed with
  credentials"). Public clients must send NO credentials. Native iOS/Android
  doesn't enforce CORS, so this only bites on Expo web — but Expo web is the
  Replit preview pane, so it matters.
  **How to apply:** any unauthenticated fetch layer for this API must omit credentials.

- **Server ignores `sortBy`.** `storage.getPrompts` always orders by
  `updatedAt desc` regardless of `sortBy=trending|recent|featured`. The toggle is
  a client-only cache-buster. Apply "trending" ordering client-side
  (e.g. by `likes + usageCount`).

- **NSFW is served to unauthenticated callers.** The prompts handler sets
  `showNsfw` from the authenticated user's preference and defaults it to `true`;
  there is no query param to force-disable it. A public client must filter
  `isNsfw` client-side (App Store risk otherwise).

- **`GET /api/prompts/:id` does not check `isPublic`.** It gates only on
  `subCommunityId`, so a private prompt is retrievable by anyone who knows its id.
  Pre-existing backend gap, not introduced by the mobile app; worth an additive
  backend fix.
