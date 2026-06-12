# Seed-corpus harvesting & audits

**Pipeline:** `/harvest-source` skill (`.claude/skills/harvest-source/`) →
JSONL in `data/seed/assets-<kind>.jsonl` + `SOURCES.md` provenance log +
`wishlist.jsonl` → (future) `import-seed.ts` into v2 assets. Each run on a
fresh `claude/harvest-<source>-<yyyymmdd>` branch off main (never reuse a
harvest branch — that's how run #2 nearly executed on a stale skill).

## Validated state (as of 2026-06-12)

- **Run #1** PatrickJS/awesome-cursorrules, 41 rules @ `b044f956` — corrupted
  by WebFetch, repaired in PR #9, 41/41 byte-exact.
- **Run #2** anthropics/skills, 11 skill bundles @ `5754626` — validated the
  `content_files` bundle path, per-directory licenses, and the negative test
  (unlicensed repo → wishlist only). Independently audited post-merge:
  72/72 files byte-exact after the audit added `LICENSE.txt` to each bundle
  and relabeled `mit` → `apache-2.0`.
- **Both paths (single-file + bundle) are validated → fan-out approved.**

## Audit procedure (run this on every harvest PR before trusting it)

The run's own validator passing is NOT the audit. Independently:

1. Shallow-clone the pinned commit: `git fetch --depth 1 origin <sha>` —
   gives the full tree (raw.githubusercontent.com works in the sandbox; the
   unauthenticated GitHub API rate-limits).
2. Byte-compare every `content_text` / every file in every `content_files`
   against the tree (`upstream_bytes == stored_text.encode()`).
3. Recompute `content_hash`: sha256 of `content_text`, or for bundles sha256
   of `content_files.map(f => `${f.path}\n${f.text}`).join('\n')` (formula in
   `validate-jsonl.mjs`).
4. **Completeness:** diff bundle paths vs the full upstream dir listing —
   omissions must be documented in SOURCES.md (binaries) or are defects
   (run #2's missing LICENSE.txt files were found this way).
5. License: verify the LICENSE file content at the pinned SHA yourself, check
   the registry code is the *actual* license (see license-registry.md), and
   verify wishlist-only for negative entries (grep assets files for leakage).

## Rules learned the hard way

- WebFetch is forbidden for content (silently summarizes/reflows — PR #7/#9).
- Bundles must carry the harvested dir's own LICENSE/NOTICE byte-exact
  (Apache/BSD require shipping license text with redistributions).
- Binaries can't ride in JSONL: exclude + document runtime impact in
  SOURCES.md; skip the asset if binaries are essential. Oversized bundles
  (e.g. anthropics/skills `claude-api`, ~500KB) → wishlist for a future
  large-asset path.
- `content_hash` is an integrity hash of stored bytes; the deduper's
  normalized hash is a dedupe key only — never conflate (PR #7's
  unfalsifiable design).
