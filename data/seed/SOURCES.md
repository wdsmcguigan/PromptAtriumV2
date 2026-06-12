# Seed Corpus Sources

## anthropics/skills

- **URL**: https://github.com/anthropics/skills
- **Repo-level license**: None (license-detector exit 2 — `arr`)
- **Per-skill license**: Apache-2.0 per `LICENSE.txt` in each eligible skill directory
- **Commit pinned**: `57546260929473d4e0d1c1bb75297be2fdfa1949`
- **Fetched**: 2026-06-12

### Eligibility determination

The repo itself carries no LICENSE file; `license-detector.mjs` returns exit 2 at the repo level.
However, the README states "Many skills in this repo are open source (Apache 2.0)," and each
skill directory that is open source carries its own `LICENSE.txt` (Apache-2.0). Under the
borderline rule (per-file license), skills with Apache-2.0 `LICENSE.txt` files were treated as
eligible. Apache-2.0 maps to `mit` output code (SPDX preserved as `Apache-2.0` in
`provenance.upstream_license`).

### Assets taken: 11 skills

| Skill | Files in bundle |
|---|---|
| algorithmic-art | SKILL.md + templates/generator_template.js + templates/viewer.html |
| brand-guidelines | SKILL.md |
| canvas-design | SKILL.md (binary TTF fonts excluded) |
| frontend-design | SKILL.md |
| internal-comms | SKILL.md + examples/ (4 files) |
| mcp-builder | SKILL.md + reference/ (4 files) + scripts/ (4 files) |
| skill-creator | SKILL.md + agents/ + scripts/ + eval-viewer/ + references/ + assets/ (16 files total) |
| slack-gif-creator | SKILL.md + core/ (4 files) + requirements.txt |
| theme-factory | SKILL.md + themes/ (10 files) |
| web-artifacts-builder | SKILL.md + scripts/init-artifact.sh + scripts/bundle-artifact.sh |
| webapp-testing | SKILL.md + scripts/with_server.py + examples/ (3 files) |

### Assets skipped / wishlisted

| Item | Reason |
|---|---|
| `docx` | Proprietary — "© 2025 Anthropic, PBC. All rights reserved." |
| `pdf` | Same proprietary license |
| `pptx` | Same proprietary license |
| `xlsx` | Same proprietary license |
| `doc-coauthoring` | No `LICENSE.txt` found in skill directory |
| `claude-api` | Apache-2.0 eligible but bundle too large (~500KB): 42KB SKILL.md + shared/ reference docs including 118KB model-migration.md |

### Anomalies / Binary exclusions

- `canvas-design/canvas-fonts/`: 80+ binary TTF files (OFL-licensed fonts). Not includable in JSONL
  `content_files` (binary). SKILL.md references them as `./canvas-fonts/` at runtime. Noted in
  bundle description; fonts must be installed separately.
- `web-artifacts-builder/scripts/shadcn-components.tar.gz`: Binary tarball (~20KB). Excluded.
  `init-artifact.sh` installs shadcn components at runtime; the tarball is a local cache only.
- `theme-factory/theme-showcase.pdf`: Binary PDF (124KB). Excluded. SKILL.md references it for
  display only; themes are defined in `themes/*.md` text files which are included.

## jujumilk3/leaked-system-prompts (NEGATIVE TEST)

- **URL**: https://github.com/jujumilk3/leaked-system-prompts
- **License**: None (license-detector exit 2 — `arr`)
- **Outcome**: Wishlisted only; no content copied. This confirms the license gate works correctly
  for repos with no LICENSE file — `arr` default, ingest stopped immediately.

---



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

### Repair (2026-06-12, post-merge audit)

A byte-faithfulness audit against the pinned SHA found 8 run-1 assets whose
content diverged from upstream (WebFetch had summarized/truncated them) and 13
with trailing-newline drift; `provenance.content_hash` was also being recorded
as the deduper's *normalized* hash rather than an integrity hash. All 41 assets
were refetched verbatim from raw.githubusercontent.com at the pinned commit;
`content_hash` is now sha256 of the exact stored `content_text` and is enforced
by validate-jsonl.mjs. The skill now forbids WebFetch for content.
