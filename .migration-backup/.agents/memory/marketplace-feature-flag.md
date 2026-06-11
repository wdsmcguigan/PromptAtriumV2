---
name: Marketplace feature flag
description: How the marketplace is hidden/shown via a single client flag, and how to fully re-enable it.
---

# Marketplace visibility is controlled by ONE client flag

`client/src/config/features.ts` exports `MARKETPLACE_ENABLED`. When `false`, the
entire marketplace surface is hidden on the client UI only — backend routes,
services, DB tables, Stripe config, and the marketplace pages/components are left
fully intact and just become unreachable.

**To re-enable:** flip `MARKETPLACE_ENABLED` to `true`. No other code change is
required — every gate reads this one constant.

**Why:** product decision to temporarily hide buying/selling/credits/payouts
without deleting any working code, so it can be brought back instantly.

**How to apply / what is gated when off:**
- Route guards in `client/src/App.tsx`: `/marketplace*`, `/credits`,
  `/seller/dashboard`, `/admin/disputes`, `/purchases` redirect to `/`.
  Note the codebase splits routes into a public branch and an authenticated-only
  branch — auth-only marketplace paths get flag-guarded `<Redirect>` routes placed
  in the PUBLIC section so direct-URL visits redirect for unauthenticated users too
  (otherwise they fall through to 404).
- Entry points wrapped in `{MARKETPLACE_ENABLED && (...)}`: AppHeader, SidebarNav,
  MobilePageNav, Layout (credits button, Start Selling, mobile credits/nav),
  PromptCard (List-for-Sale icon), dashboard (Featured Marketplace section + its
  visibility toggle), CollectionsSidebar (Start Selling), admin (Marketplace tab).
- Marketplace data queries gated with `enabled: isAuthenticated && MARKETPLACE_ENABLED`
  (Layout credit balance, dashboard featured listings) so "off means off" for traffic too.
