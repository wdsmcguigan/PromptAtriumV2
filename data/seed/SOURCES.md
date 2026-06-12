# Seed Corpus Sources

## PatrickJS/awesome-cursorrules

- **URL**: https://github.com/PatrickJS/awesome-cursorrules
- **License**: CC0-1.0 (confirmed via LICENSE file)
- **Commit pinned**: `b044f956f021b6e8877f16781bcfc466a6a120e9`
- **Fetched**: 2026-06-12

### Assets taken: 41 rules (merged from 2 runs)

Selected from 257 `.mdc` files in the `rules/` directory. Curation policy: maximize
breadth across languages, frameworks, and cross-cutting concerns; take the most actionable
file when multiple cover the same tool.

**Run 1 (2026-06-12, unauthenticated WebFetch — 21 assets):**
clean-code, anti-overengineering, anti-sycophancy, go, docker, nestjs-anti-hallucination,
fastapi, cpp, embedded-stm32-hal, kotlin-springboot, network-troubleshoot, blender-python-addon,
git-conventional-commit-messages, javascript-typescript-code-quality, jest, nextjs-app-router,
angular-typescript, flutter-app-expert, elixir-engineer-guidelines, laravel-php-83,
code-pair-interviews.

**Run 2 (2026-06-12, authenticated GitHub API — 20 new assets):**
typescript, react, python, postgresql, security-devsecops-ssdls-appsec, rust-general,
tailwind, svelte, vue, nextjs, node-express, database (Prisma/Supabase), tanstack-query,
tanstack-router, tanstack-start, pr-review, react-native-expo, java-springboot-jpa,
react-router-v7, playwright-e2e.

### Assets skipped / deferred

- **sveltekit-typescript-guide** — 769-byte stub (section headings only); wishlisted
- **rust.mdc** — misleading name; is Solana/Anchor-specific, not general Rust; wishlisted
- **database.mdc** — run 1 found it too generic; run 2 included it (actionable Prisma+Supabase content)
- **deno-integration-techniques** — specific to `@findhow` ecosystem, not general-purpose
- **Cypress variants** (5 files) — only playwright-e2e harvested as representative; best Cypress variant deferred
- **HTMX variants** (5 files) — similar to each other; deferred
- **beefreeSDK files** — vendor-specific, limited audience
- **~216 remaining files** — deferred to future harvest passes

### Deduplication notes

- 6 records were exact content-hash duplicates (removed by deduper)
- 4 additional path-based duplicates found (same path but slightly different whitespace
  between WebFetch vs. authenticated raw API fetch). Raw-API versions retained.

### Anomalies

- Run 1 had no `GITHUB_TOKEN`; used WebFetch. A few files returned summaries instead of
  verbatim content — those were excluded in run 1 and correctly fetched in run 2.
- Run 2 had GITHUB_TOKEN available; all content fetched from pinned raw.githubusercontent.com
  URLs via authenticated curl — byte-faithful.
