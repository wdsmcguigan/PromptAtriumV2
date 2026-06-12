#!/usr/bin/env node
/**
 * Deduplicates PromptAtrium seed corpus JSONL files by normalized content hash.
 * When two records have identical normalized content, the one that appears first
 * (i.e. from the "more upstream" file, passed first on the command line) wins.
 *
 * Usage:
 *   # Deduplicate a single file in place:
 *   node deduper.mjs assets-rule.jsonl > assets-rule.deduped.jsonl
 *
 *   # Merge + deduplicate across multiple files (pass upstream source first):
 *   node deduper.mjs assets-rule-awesome-cursorrules.jsonl assets-rule-agent-rules.jsonl \
 *     > data/seed/assets-rule.jsonl
 *
 * Outputs deduplicated JSONL to stdout.
 * Reports duplicate pairs and summary to stderr.
 *
 * Normalization:
 *   - Trim leading/trailing whitespace
 *   - Normalize line endings to \n
 *   - Strip trailing whitespace from each line
 *   - Collapse 3+ consecutive blank lines to 2
 * This tolerates minor formatting differences (trailing spaces, CRLF)
 * while treating meaningfully different content as distinct.
 */

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const files = process.argv.slice(2);
if (!files.length) {
  console.error('Usage: node deduper.mjs file1.jsonl [file2.jsonl ...] > out.jsonl');
  process.exit(1);
}

function normalize(text) {
  return text
    .trim()
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+$/gm, '')       // strip trailing whitespace per line
    .replace(/\n{3,}/g, '\n\n');    // collapse excessive blank lines
}

function contentHash(obj) {
  let text;
  if (typeof obj.content_text === 'string') {
    text = obj.content_text;
  } else if (Array.isArray(obj.content_files)) {
    // For bundles, hash the concatenation of all file texts sorted by path
    // (path sort makes hash stable regardless of array order)
    text = obj.content_files
      .slice()
      .sort((a, b) => a.path.localeCompare(b.path))
      .map(f => `===FILE:${f.path}===\n${f.text}`)
      .join('\n');
  } else {
    text = JSON.stringify(obj); // fallback: hash the whole record
  }
  return createHash('sha256').update(normalize(text)).digest('hex');
}

const seen = new Map();   // hash → winning record
const dupeLog = [];
let total = 0;

for (const file of files) {
  let raw;
  try {
    raw = readFileSync(file, 'utf8');
  } catch (e) {
    console.error(`Cannot read ${file}: ${e.message}`);
    process.exit(1);
  }

  const lines = raw.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    total++;

    let obj;
    try {
      obj = JSON.parse(line);
    } catch (e) {
      console.error(`${file}:${i + 1}: skipping invalid JSON — ${e.message}`);
      continue;
    }

    const hash = contentHash(obj);

    if (seen.has(hash)) {
      const winner = seen.get(hash);
      dupeLog.push({
        kept:    `"${winner.name}" (${winner.provenance?.repo ?? '?'})`,
        dropped: `"${obj.name}" (${obj.provenance?.repo ?? '?'})`,
        hash:    hash.slice(0, 12),
      });
    } else {
      seen.set(hash, obj);
      // Attach the content hash to provenance for downstream use
      const out = {
        ...obj,
        provenance: { ...obj.provenance, content_hash: hash },
      };
      console.log(JSON.stringify(out));
    }
  }
}

// Summary to stderr (won't pollute the JSONL output)
if (dupeLog.length) {
  console.error('\nDuplicates removed:');
  for (const d of dupeLog) {
    console.error(`  [${d.hash}] kept ${d.kept} | dropped ${d.dropped}`);
  }
}
console.error(`\nTotal processed: ${total} | Unique: ${seen.size} | Duplicates: ${dupeLog.length}`);
