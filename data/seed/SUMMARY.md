# Harvest summary — multiple sources — 2026-06-12

## Cumulative corpus (3 runs)

| Kind  | Count | Source |
|-------|-------|--------|
| rule  | 41    | PatrickJS/awesome-cursorrules (CC0) |
| skill | 11    | anthropics/skills (Apache-2.0 per-skill) |
| **Total** | **52** | |

## License distribution

| License code | Count | SPDX |
|---|---|---|
| cc0  | 41 | CC0-1.0 |
| mit  | 11 | Apache-2.0 (mapped) |

## Top sources by yield

1. PatrickJS/awesome-cursorrules — 41 rule assets
2. anthropics/skills — 11 skill assets

## Run breakdown

| Run | Kind | Assets | Method | Notes |
|-----|------|--------|--------|-------|
| 1 (2026-06-12) | rule | 21 | WebFetch (unauthenticated) | Post-repair: byte-faithful |
| 2 (2026-06-12) | rule | +20 | curl + GITHUB_TOKEN | Byte-faithful raw API |
| Dedup | rule | −10 | content-hash + path | 6 exact + 4 path-based |
| Repair (2026-06-12) | rule | 0 net | curl refetch | Fixed 8 corrupted + 13 hash drift |
| 3 (2026-06-12) | skill | 11 | curl + GITHUB_TOKEN | Per-skill Apache-2.0 gate |
| **Total** | | **52** | | |

## Validation run 2 — anthropics/skills — skill bundles (2026-06-12)

### License gate summary

| Repo | Repo-level license | Per-skill licenses | Outcome |
|---|---|---|---|
| anthropics/skills | None (exit 2 arr) | Apache-2.0 in LICENSE.txt per dir | Per-file rule applied; 11 of 17 skills eligible |
| jujumilk3/leaked-system-prompts | None (exit 2 arr) | N/A | **NEGATIVE TEST** — wishlist only, zero content copied |

### Skills harvested (11)

| Skill | Bundle files | Tags |
|---|---|---|
| algorithmic-art | SKILL.md + 2 templates | generative-art, p5js |
| brand-guidelines | SKILL.md | branding, design |
| canvas-design | SKILL.md (fonts excluded) | design, art, pdf |
| frontend-design | SKILL.md | frontend, design, ui |
| internal-comms | SKILL.md + 4 examples | writing, communications |
| mcp-builder | SKILL.md + 4 ref + 4 scripts | mcp, api, python, typescript |
| skill-creator | SKILL.md + 15 files | skills, evals, meta |
| slack-gif-creator | SKILL.md + 4 core + reqs | slack, gif, python |
| theme-factory | SKILL.md + 10 themes | design, themes |
| web-artifacts-builder | SKILL.md + 2 scripts | react, typescript, artifacts |
| webapp-testing | SKILL.md + 1 script + 3 examples | testing, playwright, python |

### Skipped / wishlisted (6)

| Item | Reason |
|---|---|
| docx | Anthropic proprietary (© 2025 Anthropic, All rights reserved) |
| pdf | Same |
| pptx | Same |
| xlsx | Same |
| doc-coauthoring | No LICENSE.txt |
| claude-api | Apache-2.0 eligible but ~500KB bundle (oversized for JSONL) |

### Negative test result

`jujumilk3/leaked-system-prompts` → `license-detector.mjs` returned exit 2 (arr, no license file).
Pipeline stopped immediately — zero content ingested — and added 1 wishlist record. Gate confirmed working.

## Wishlist total

13 items recorded across all runs.

## Next steps

- Full harvest of remaining ~216 `rule` assets from awesome-cursorrules (Astro, SolidJS, HTMX, Cypress, etc.)
- Ingest path for large bundles: claude-api skill needs a chunked or pointer asset format
- Explore additional skill sources: `github/skills`, community skill collections with permissive licenses
- Build `import-seed.ts` to load JSONL into assets + asset_versions tables
