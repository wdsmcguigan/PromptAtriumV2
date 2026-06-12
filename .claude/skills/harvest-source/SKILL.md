---
name: harvest-source
description: Harvest AI context assets (rules, skills, commands, prompts, MCP server configs) from a GitHub repo into the PromptAtrium seed corpus JSONL format. Use when asked to harvest, collect, or ingest assets from a source repo.
---

# /harvest-source

Harvests AI context assets from a permissively-licensed GitHub repo and writes them to `data/seed/assets-<kind>.jsonl` on the `claude/seed-corpus` branch.

**Invoke as:** `/harvest-source on PatrickJS/awesome-cursorrules [kind: rule]`

## Helper scripts

Three scripts live alongside this SKILL.md in `.claude/skills/harvest-source/`. Run them from the repo root:

```bash
# 1. Check if a repo is license-eligible before touching it
GITHUB_TOKEN=$GITHUB_TOKEN node .claude/skills/harvest-source/license-detector.mjs owner/repo
# stdout: JSON with { code, eligible, notes }
# exit 0 = eligible | exit 2 = ineligible | exit 3 = needs human review

# 2. Validate a JSONL file against the schema
node .claude/skills/harvest-source/validate-jsonl.mjs data/seed/assets-rule.jsonl

# 3. Deduplicate one or more JSONL files (pass upstream source first)
node .claude/skills/harvest-source/deduper.mjs \
  data/seed/assets-rule-awesome-cursorrules.jsonl \
  data/seed/assets-rule-agent-rules.jsonl \
  > data/seed/assets-rule.jsonl
```

## Step-by-step procedure

### 1. Check the license FIRST

Run `license-detector.mjs` on the target repo. Stop immediately if exit code is 2 (ineligible). If exit 3, note in `wishlist.jsonl` and stop — do not copy content.

```bash
GITHUB_TOKEN=$GITHUB_TOKEN node .claude/skills/harvest-source/license-detector.mjs PatrickJS/awesome-cursorrules
```

### 2. Pin the commit SHA

All provenance must reference a specific commit, never a branch name:

```bash
GITHUB_TOKEN=$GITHUB_TOKEN \
  curl -s -H "Authorization: Bearer $GITHUB_TOKEN" \
    https://api.github.com/repos/PatrickJS/awesome-cursorrules/commits/HEAD \
  | node -e "const d=require('fs').readFileSync('/dev/stdin','utf8'); console.log(JSON.parse(d).sha)"
```

Store this SHA. Every `source_url` and `provenance.commit_sha` uses it.

### 3. Fetch and curate

Fetch file content via the GitHub API (blob endpoint) or raw URL pinned to the SHA. **Curate — do not dump.** An asset earns inclusion if a Claude Code / Cursor power user would actually install it. When a collection has 50 variants of the same rule, take the best 1-3.

### 4. Write JSONL

Write one JSONL file per kind. One JSON object per line, no trailing commas:

```json
{
  "kind": "rule",
  "name": "Next.js App Router conventions",
  "description": "1-2 sentence summary YOU write — not copied from the source",
  "tags": ["nextjs", "react", "typescript"],
  "license": "cc0",
  "content_text": "...full text, byte-faithful...",
  "provenance": {
    "source_url": "https://github.com/PatrickJS/awesome-cursorrules/blob/<SHA>/rules/nextjs.mdc",
    "repo": "PatrickJS/awesome-cursorrules",
    "path": "rules/nextjs.mdc",
    "commit_sha": "<full 40-char SHA>",
    "upstream_license": "CC0-1.0",
    "fetched_at": "<ISO 8601 timestamp>",
    "attribution": "author/handle if the collection credits one"
  }
}
```

For skill bundles use `content_files` instead of `content_text`:
```json
"content_files": [
  { "path": "SKILL.md", "text": "..." },
  { "path": "driver.mjs", "text": "..." }
]
```

### 5. Validate

```bash
node .claude/skills/harvest-source/validate-jsonl.mjs data/seed/assets-rule.jsonl
```

Fix all errors before proceeding. The validator catches: missing fields, branch-name URLs, short SHAs, ambiguous content, non-standard license codes.

### 6. Deduplicate

When merging multiple sources, pass the most upstream source first:

```bash
node .claude/skills/harvest-source/deduper.mjs \
  data/seed/assets-rule-source-a.jsonl \
  data/seed/assets-rule-source-b.jsonl \
  > data/seed/assets-rule.jsonl
```

The deduper normalizes content (trim, CRLF→LF, strip trailing whitespace per line), hashes with SHA-256, and keeps the first-seen record when hashes collide. It adds `provenance.content_hash` to each output record.

### 7. Write wishlist and SOURCES.md

`data/seed/wishlist.jsonl` — ineligible-but-valuable records, **no `content_text`/`content_files`**:
```json
{ "name": "...", "url": "...", "reason": "Great rules file but repo has no license" }
```

`data/seed/SOURCES.md` — one section per source visited:
- Source URL and license detected
- How many assets taken / skipped and why
- Any anomalies (per-file license, borderline cases)

### 8. Commit and push

```bash
git checkout -b claude/seed-corpus 2>/dev/null || git checkout claude/seed-corpus
git add data/seed/
git commit -m "harvest: <source-repo> — <N> <kind> assets"
git push -u origin claude/seed-corpus
```

---

## License eligibility table

| License | Code | Eligible |
|---|---|---|
| CC0-1.0 | `cc0` | Yes |
| CC-BY-4.0 | `cc-by-4.0` | Yes |
| CC-BY-SA-4.0 | `cc-by-sa-4.0` | Yes |
| MIT, MIT-0 | `mit` | Yes |
| Apache-2.0 | `mit` (keep SPDX in upstream_license) | Yes |
| BSD-2/3-Clause, ISC | `mit` (keep SPDX in upstream_license) | Yes |
| CC-BY-NC-*, CC-BY-ND-* | `arr` | **No** |
| No LICENSE file | `arr` | **No** — default = all rights reserved |
| Unlicensed / proprietary | `arr` | **No** |
| GPL, LGPL, AGPL | Needs review | **No** for redistribution in this context |
| Unknown redistributable | SPDX id | **Needs human review** (exit 3) |

When a repo has no `license` field in the GitHub API response (`NOASSERTION`), treat as `arr` and add to wishlist only.

**Borderline rule:** if an individual file inside an otherwise unlicensed repo carries its own permissive license header, you may ingest that file only — record the per-file license in `provenance.upstream_license` and note it in SOURCES.md.

## Valid kinds

`prompt` | `system_prompt` | `rule` | `skill` | `command` | `mcp-server` | `stack`

## Valid license codes (output field)

`cc0` | `cc-by-4.0` | `cc-by-sa-4.0` | `mit` | `arr`

Use `arr` ("all rights reserved") for anything ineligible. Never leave license blank.

## Quality bar

- Write your own `description` — never copy from the source.
- `content_text` must be byte-faithful to the source (no edits).
- Tags: 2-6 lowercase strings, technology/framework/task focused.
- When a collection has many similar assets, take the 1-3 that are most distinctive.
- Do not include one-liners, placeholder files, or assets that are merely lists of other assets.

## Gotchas

- **Never use branch names in URLs.** `blob/main/` will break when the branch moves. Always substitute the pinned commit SHA.
- **Skills are bundles.** A skill asset must include `SKILL.md` plus all referenced scripts in `content_files`. A lone `SKILL.md` without its driver is incomplete.
- **GitHub API rate limit.** Anonymous calls allow ~60/hour. Always set `GITHUB_TOKEN` for harvesting sessions that touch many files.
- **Wishlist ≠ ingest.** Never put `content_text` or `content_files` in a wishlist record. Record URL + reason only.
- **MCP server configs are pointers.** Record the env variable *names* (never values), package identifier, transport, repo URL. License check still applies to the server's own repo.
