#!/usr/bin/env node
/**
 * Blight screening — deterministic content-safety checks for seed corpus JSONL.
 *
 * The other gates verify faithfulness (byte-exact vs upstream) and license.
 * Neither asks whether the content is SAFE: a byte-perfect, properly-licensed
 * copy of malicious instructions passes both. This script is the deterministic
 * layer of the blight inspection; the agent layer (adversarial read of new
 * sources and suspicious update diffs) is procedural — see SKILL.md and
 * .agents/memory/seed-harvesting.md.
 *
 * Checks (high-signal, fail-closed):
 *   invisible-unicode   zero-width/bidi control chars (hidden-instruction vector)
 *   piped-shell         curl|sh, wget|sh, iwr|iex, powershell -enc
 *   encoded-exec        eval(atob…), exec(base64…), Function(fromCharCode…)
 *   base64-blob         contiguous base64 runs >= 300 chars
 *   injection-phrase    "ignore previous instructions", covert-exfil phrasing
 *   raw-ip-url          http(s)://<literal IPv4>
 *
 * Findings are fatal (exit 1) unless allowlisted in
 * data/seed/blight-allowlist.json:
 *   [{ "content_hash": "...", "check": "piped-shell",
 *      "reason": "...", "reviewed_by": "...", "date": "YYYY-MM-DD" }]
 * An entry covers ONE (record, check) pair — read the matched content in full
 * before allowlisting; never allowlist a record you haven't read.
 *
 * Usage:  node blight-check.mjs data/seed/assets-*.jsonl
 * Exit:   0 clean (or all findings allowlisted) | 1 findings | 2 script error
 */

import { createReadStream, existsSync, readFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { resolve } from 'node:path';

const ALLOWLIST_PATH = 'data/seed/blight-allowlist.json';

const CHECKS = [
  {
    id: 'invisible-unicode',
    desc: 'zero-width / bidi control characters',
    // zero-width spaces/joiners, bidi embedding/override/isolates, BOM mid-text
    re: /[\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF]/g,
  },
  {
    id: 'piped-shell',
    desc: 'remote content piped into a shell',
    re: /\b(?:curl|wget)\b[^|\n]{0,200}\|\s*(?:sudo\s+)?(?:ba|z|da|fi)?sh\b|\biwr\b[^|\n]{0,200}\|\s*iex\b|powershell[^\n]{0,80}-enc/gi,
  },
  {
    id: 'encoded-exec',
    desc: 'execution of decoded/encoded payloads',
    re: /\beval\s*\(\s*atob|\bexec(?:Sync)?\s*\(\s*(?:atob|Buffer\.from)|base64\s*(?:-d|--decode)[^\n]{0,40}\|\s*(?:ba)?sh|Function\s*\([^)]{0,80}fromCharCode/gi,
  },
  {
    id: 'base64-blob',
    desc: 'long contiguous base64 run (>=300 chars)',
    re: /[A-Za-z0-9+/]{300,}={0,2}/g,
  },
  {
    id: 'injection-phrase',
    desc: 'instruction-injection / covert-action phrasing',
    re: /ignore\s+(?:all\s+)?(?:previous|prior|earlier|above)\s+(?:instructions|context|rules)|do\s+not\s+(?:tell|inform|mention\s+(?:this\s+)?to|reveal\s+(?:this\s+)?to)\s+the\s+(?:user|owner|human)|without\s+(?:telling|informing|alerting|notifying)\s+the\s+user|(?:secretly|silently|covertly)\s+(?:send|post|upload|transmit|forward)|exfiltrat/gi,
  },
  {
    id: 'raw-ip-url',
    desc: 'URL with a literal IPv4 address',
    re: /https?:\/\/(?:\d{1,3}\.){3}\d{1,3}(?![\d.])/g,
  },
];

function snippet(text, index, len) {
  const start = Math.max(0, index - 40);
  return text
    .slice(start, index + len + 40)
    .replace(/\s+/g, ' ')
    .slice(0, 120);
}

async function readJsonl(filePath) {
  const records = [];
  const rl = createInterface({ input: createReadStream(filePath), crlfDelay: Infinity });
  for await (const line of rl) {
    const t = line.trim();
    if (t) records.push(JSON.parse(t));
  }
  return records;
}

const files = process.argv.slice(2);
if (!files.length) {
  console.error('Usage: node blight-check.mjs <file.jsonl> [file2.jsonl ...]');
  process.exit(2);
}

let allowlist = [];
if (existsSync(resolve(ALLOWLIST_PATH))) {
  allowlist = JSON.parse(readFileSync(resolve(ALLOWLIST_PATH), 'utf8'));
  for (const e of allowlist) {
    if (!e.content_hash || !e.check || !e.reason || !e.reviewed_by || !e.date) {
      console.error(`[ERROR] malformed allowlist entry (needs content_hash, check, reason, reviewed_by, date): ${JSON.stringify(e)}`);
      process.exit(2);
    }
  }
}
const allowed = new Set(allowlist.map((e) => `${e.content_hash}::${e.check}`));

let fatal = 0;
let waived = 0;
let checkedRecords = 0;

for (const file of files) {
  let records;
  try {
    records = await readJsonl(file);
  } catch (e) {
    console.error(`[ERROR] cannot read ${file}: ${e.message}`);
    process.exit(2);
  }

  for (const record of records) {
    const hash = record.provenance?.content_hash ?? '(no-hash)';
    const parts =
      typeof record.content_text === 'string'
        ? [{ path: '(content_text)', text: record.content_text }]
        : (record.content_files ?? []);
    if (!parts.length) continue; // wishlist-style records carry no content
    checkedRecords++;

    for (const check of CHECKS) {
      const hits = [];
      for (const part of parts) {
        check.re.lastIndex = 0;
        let m;
        while ((m = check.re.exec(part.text)) !== null) {
          hits.push({ path: part.path, snippet: snippet(part.text, m.index, m[0].length) });
          if (hits.length >= 5) break; // enough to report
        }
        if (hits.length >= 5) break;
      }
      if (!hits.length) continue;

      const key = `${hash}::${check.id}`;
      if (allowed.has(key)) {
        waived++;
        console.log(`[ALLOWLISTED] ${record.name} — ${check.id} (${hits.length}+ hit(s))`);
        continue;
      }
      fatal++;
      console.error(`[BLIGHT] ${record.name} — ${check.id}: ${check.desc}`);
      console.error(`  content_hash: ${hash}`);
      for (const h of hits) console.error(`  ${h.path}: …${h.snippet}…`);
      console.error(`  → read the full matched content; remove the asset, or if verified benign add`);
      console.error(`    {"content_hash":"${hash}","check":"${check.id}",...} to ${ALLOWLIST_PATH}`);
    }
  }
}

console.log(`\nBlight screening: ${checkedRecords} record(s), ${fatal} finding(s), ${waived} allowlisted`);
process.exit(fatal > 0 ? 1 : 0);
