# Seed Corpus Sources

## PatrickJS/awesome-cursorrules

- **URL**: https://github.com/PatrickJS/awesome-cursorrules
- **License**: CC0-1.0 (confirmed via LICENSE file)
- **Commit pinned**: `b044f956f021b6e8877f16781bcfc466a6a120e9`
- **Fetched**: 2026-06-12

### Assets taken: 21 rules

Selected from ~100+ `.mdc` files in the `rules/` directory. Curation policy: one asset
per distinct framework/topic; when multiple files covered the same tool, only the most
specific and actionable was included.

| File | Included | Notes |
|---|---|---|
| clean-code.mdc | ✅ | General quality baseline |
| anti-overengineering.mdc | ✅ | Short, high-signal |
| anti-sycophancy-code-discipline-cursorrules-prompt-file.mdc | ✅ | Outstanding — 17 specific directives |
| go.mdc | ✅ | Idiomatic, specific |
| docker.mdc | ✅ | Production-focused, specific |
| nestjs-anti-hallucination-cursorrules-prompt-file.mdc | ✅ | Outstanding — blocked phantom imports with examples |
| fastapi.mdc | ✅ | Python/FastAPI coverage |
| cpp.mdc | ✅ | Comprehensive C++ rules |
| embedded-stm32-hal.mdc | ✅ | Distinctive embedded niche |
| kotlin-springboot-best-practices-cursorrules-prompt-file.mdc | ✅ | Has inline code examples |
| network-troubleshoot.mdc | ✅ | High-quality safety-first guide |
| blender-python-addon.mdc | ✅ | Distinctive Blender/Python niche |
| git-conventional-commit-messages.mdc | ✅ | Full spec |
| javascript-typescript-code-quality-cursorrules-pro.mdc | ✅ | General JS/TS discipline |
| jest-unit-testing-cursorrules-prompt-file.mdc | ✅ | With example templates |
| nextjs-app-router-cursorrules-prompt-file.mdc | ✅ | Next.js App Router |
| angular-typescript-cursorrules-prompt-file.mdc | ✅ | Angular 18 specific |
| flutter-app-expert-cursorrules-prompt-file.mdc | ✅ | BLoC/GetIt/GoRouter |
| elixir-engineer-guidelines-cursorrules-prompt-file.mdc | ✅ | Full Phoenix stack |
| laravel-php-83-cursorrules-prompt-file.mdc | ✅ | PHP 8.3 / Laravel |
| code-pair-interviews.mdc | ✅ | Interview-quality code rules |

### Assets skipped (~80+)

- **database.mdc** — overly generic ("use proper X" for every bullet); not actionable enough
- **flutter-riverpod-cursorrules-prompt-file.mdc** — WebFetch could not return verbatim content; would need direct API access to verify
- **java-springboot-jpa-cursorrules-prompt-file.mdc** — WebFetch returned a summary, not verbatim content; withhold until verifiable
- **astro-typescript-cursorrules-prompt-file.mdc** — WebFetch returned a summary
- **github-code-quality-cursorrules-prompt-file.mdc** — WebFetch returned a summary
- **deno-integration-techniques-cursorrules-prompt-fil.mdc** — specific to `@findhow` ecosystem, not general-purpose
- **Cypress variants** (5 files) — highly similar; none selected for this validation run; a future run could pick the best 1
- **HTMX variants** (5 files) — similar to each other; deferred
- **beefreeSDK* files** — vendor-specific, limited audience
- **Remaining ~65 files** — not fetched in this validation run; cap applied at ~30 before fetching

### Anomalies

- `GITHUB_TOKEN` was not available in the session; used `WebFetch` against raw.githubusercontent.com.
  The license-detector.mjs script could not run; license was manually confirmed via the LICENSE file (CC0-1.0).
- GitHub API rate-limited unauthenticated requests; all content fetched from `raw.githubusercontent.com` URLs pinned to the commit SHA.
- A small number of files could only be retrieved as summaries by the WebFetch model; those were excluded.
