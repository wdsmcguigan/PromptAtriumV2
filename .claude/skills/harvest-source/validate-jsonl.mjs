#!/usr/bin/env node
/**
 * Validates a PromptAtrium seed corpus JSONL file against the canonical schema.
 *
 * Usage:
 *   node validate-jsonl.mjs data/seed/assets-rule.jsonl
 *   node validate-jsonl.mjs data/seed/*.jsonl   # validate multiple files
 *
 * Exit codes:
 *   0 — all records valid
 *   1 — one or more validation errors
 */

import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';

const VALID_KINDS    = ['prompt', 'system_prompt', 'rule', 'skill', 'command', 'mcp-server', 'stack'];
const VALID_LICENSES = ['cc0', 'cc-by-4.0', 'cc-by-sa-4.0', 'mit', 'arr'];
const PROV_REQUIRED  = ['source_url', 'repo', 'path', 'commit_sha', 'upstream_license', 'fetched_at'];

const files = process.argv.slice(2);
if (!files.length) {
  console.error('Usage: node validate-jsonl.mjs <file.jsonl> [file2.jsonl ...]');
  process.exit(1);
}

let totalErrors = 0;

for (const file of files) {
  let lineNo = 0, fileErrors = 0, fileOk = 0;

  let stream;
  try {
    stream = createReadStream(file);
  } catch (e) {
    console.error(`Cannot open ${file}: ${e.message}`);
    totalErrors++;
    continue;
  }

  const rl = createInterface({ input: stream, crlfDelay: Infinity });

  for await (const raw of rl) {
    lineNo++;
    const line = raw.trim();
    if (!line) continue;

    let obj;
    try {
      obj = JSON.parse(line);
    } catch (e) {
      console.error(`${file}:${lineNo}: invalid JSON — ${e.message}`);
      fileErrors++;
      continue;
    }

    const errs = [];

    // Top-level required fields
    for (const f of ['kind', 'name', 'description', 'tags', 'license', 'provenance']) {
      if (!(f in obj)) errs.push(`missing: ${f}`);
    }

    if (obj.kind && !VALID_KINDS.includes(obj.kind)) {
      errs.push(`invalid kind "${obj.kind}" — must be one of: ${VALID_KINDS.join(', ')}`);
    }

    if (obj.license && !VALID_LICENSES.includes(obj.license)) {
      errs.push(`non-standard license code "${obj.license}" — use arr for anything ineligible`);
    }

    if (obj.tags !== undefined && !Array.isArray(obj.tags)) {
      errs.push('tags must be an array');
    }

    // Must have content
    const hasText  = typeof obj.content_text === 'string' && obj.content_text.trim().length > 0;
    const hasFiles = Array.isArray(obj.content_files) && obj.content_files.length > 0;
    if (!hasText && !hasFiles) {
      errs.push('missing content: need content_text (string) or content_files (array)');
    }
    if (hasText && hasFiles) {
      errs.push('ambiguous: has both content_text and content_files — use one');
    }
    if (hasFiles) {
      for (let i = 0; i < obj.content_files.length; i++) {
        const cf = obj.content_files[i];
        if (typeof cf.path !== 'string') errs.push(`content_files[${i}].path must be a string`);
        if (typeof cf.text !== 'string') errs.push(`content_files[${i}].text must be a string`);
      }
    }

    // Provenance
    if (obj.provenance && typeof obj.provenance === 'object') {
      for (const f of PROV_REQUIRED) {
        if (!(f in obj.provenance)) errs.push(`provenance missing: ${f}`);
      }
      const sha = obj.provenance.commit_sha;
      if (sha && typeof sha === 'string' && sha.length < 40) {
        errs.push(`provenance.commit_sha "${sha}" looks short — use full 40-char SHA`);
      }
      const url = obj.provenance.source_url;
      if (url && typeof url === 'string') {
        if (/\/blob\/(HEAD|main|master|develop)\//i.test(url)) {
          errs.push('provenance.source_url references a branch name — pin to a commit SHA');
        }
      }
    } else if ('provenance' in obj) {
      errs.push('provenance must be an object');
    }

    if (errs.length) {
      const label = obj.name ? `"${obj.name}"` : '(unnamed)';
      console.error(`${file}:${lineNo} ${label}: ${errs.join(' | ')}`);
      fileErrors++;
    } else {
      fileOk++;
    }
  }

  const status = fileErrors === 0 ? 'OK' : 'FAIL';
  console.log(`[${status}] ${file}: ${fileOk} valid, ${fileErrors} errors (${lineNo} lines)`);
  totalErrors += fileErrors;
}

process.exit(totalErrors > 0 ? 1 : 0);
