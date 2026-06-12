#!/usr/bin/env node
/**
 * Upstream byte-exactness audit for seed corpus JSONL files.
 *
 * For every content_text and every content_files entry, fetches the upstream
 * file from raw.githubusercontent.com at the pinned commit SHA and compares
 * byte-for-byte. This automates the manual audits that caught 8 corrupted
 * assets in the pilot run (WebFetch silently summarized content).
 *
 * Complements validate-jsonl.mjs (which only checks internal consistency):
 *   validate-jsonl → stored content matches stored hash (internal integrity)
 *   audit-upstream → stored content matches upstream at pinned SHA (provenance)
 *
 * Usage:
 *   GITHUB_TOKEN=... node audit-upstream.mjs data/seed/assets-rule.jsonl
 *   GITHUB_TOKEN=... node audit-upstream.mjs data/seed/assets-*.jsonl
 *
 * Exit codes:
 *   0 — all records match upstream
 *   1 — one or more mismatches or unrecoverable fetch failures
 *
 * Environment:
 *   GITHUB_TOKEN — optional but strongly recommended to avoid the 60 req/hr
 *                  anonymous rate limit (113+ checks for the current corpus)
 */

import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
if (!GITHUB_TOKEN) {
  console.warn('[WARN] GITHUB_TOKEN not set — anonymous rate limit is 60 req/hr');
}

const files = process.argv.slice(2);
if (!files.length) {
  console.error('Usage: node audit-upstream.mjs <file.jsonl> [file2.jsonl ...]');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fetchRaw(url) {
  const headers = { 'User-Agent': 'PromptAtrium-audit/1' };
  if (GITHUB_TOKEN) headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;

  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${url}`);
  }
  return res.text();
}

function rawUrl(repo, sha, filePath) {
  return `https://raw.githubusercontent.com/${repo}/${sha}/${filePath}`;
}

async function readJsonlFile(filePath) {
  const records = [];
  const rl = createInterface({ input: createReadStream(filePath), crlfDelay: Infinity });
  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    records.push(JSON.parse(trimmed));
  }
  return records;
}

// ---------------------------------------------------------------------------
// Audit
// ---------------------------------------------------------------------------

let totalErrors = 0;
let totalChecked = 0;

for (const file of files) {
  let fileErrors = 0;
  let fileOk = 0;

  let records;
  try {
    records = await readJsonlFile(file);
  } catch (e) {
    console.error(`[ERROR] Cannot read ${file}: ${e.message}`);
    totalErrors++;
    continue;
  }

  console.log(`Auditing ${file} (${records.length} record(s))...`);

  for (const record of records) {
    const prov = record.provenance;
    // wishlist entries have no content or provenance; skip silently
    if (!prov?.repo || !prov?.commit_sha || !prov?.path) continue;

    if (typeof record.content_text === 'string') {
      // Single-file asset: upstream path = provenance.path
      const url = rawUrl(prov.repo, prov.commit_sha, prov.path);
      totalChecked++;
      try {
        const upstream = await fetchRaw(url);
        if (upstream === record.content_text) {
          fileOk++;
        } else {
          console.error(`  [MISMATCH] "${record.name}"`);
          console.error(`    URL: ${url}`);
          console.error(`    stored ${record.content_text.length}B, upstream ${upstream.length}B`);
          fileErrors++;
        }
      } catch (e) {
        console.error(`  [FETCH FAIL] "${record.name}": ${e.message}`);
        fileErrors++;
      }
    } else if (Array.isArray(record.content_files)) {
      // Bundle asset: each file lives at provenance.path/file.path
      for (const cf of record.content_files) {
        const fullPath = `${prov.path}/${cf.path}`;
        const url = rawUrl(prov.repo, prov.commit_sha, fullPath);
        totalChecked++;
        try {
          const upstream = await fetchRaw(url);
          if (upstream === cf.text) {
            fileOk++;
          } else {
            console.error(`  [MISMATCH] "${record.name}/${cf.path}"`);
            console.error(`    URL: ${url}`);
            console.error(`    stored ${cf.text.length}B, upstream ${upstream.length}B`);
            fileErrors++;
          }
        } catch (e) {
          console.error(`  [FETCH FAIL] "${record.name}/${cf.path}": ${e.message}`);
          fileErrors++;
        }
      }
    }
  }

  const status = fileErrors === 0 ? 'OK' : 'FAIL';
  console.log(`[${status}] ${file}: ${fileOk} ok, ${fileErrors} errors`);
  totalErrors += fileErrors;
}

console.log(`\nAudit complete: ${totalChecked} upstream checks, ${totalErrors} failures`);
process.exit(totalErrors > 0 ? 1 : 0);
