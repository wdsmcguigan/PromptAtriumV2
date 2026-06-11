---
name: Express 5 wildcard route syntax
description: Express 5 (path-to-regexp v8) incompatible wildcard patterns and correct replacements
---

# Express 5 wildcard route syntax

## Rule
Never use `:param(*)` or `:param(.*)` in Express 5 routes. path-to-regexp v8 rejects both.

**Why:** Express 5 upgraded to path-to-regexp v8 which removed support for custom regex inside parameter groups and unnamed wildcards.

## How to apply

| Old (Express 4) | New (Express 5) |
|---|---|
| `/path/:name(*)` | `/path/*name` |
| `/path/:name(.*)` | `/path/*name` |
| `/path/*` (anonymous) | `/path/*name` (must be named) |

Handler changes:
- If the old handler used `req.params.name`, it can continue using `req.params.name` with `/*name`.
- If the handler used `req.path` directly, just use `req.path` (no param needed at all).

## Example fix in legacyRoutes.ts
```
// Before (Express 4)
app.get("/objects/:objectPath(*)", ...)
app.get("/api/objects/serve/:path(.*)", ...)

// After (Express 5)
app.get("/objects/*objectPath", ...)   // handler uses req.path
app.get("/api/objects/serve/*servePath", ...)  // handler uses req.path.replace('/api/objects/serve', '')
```
