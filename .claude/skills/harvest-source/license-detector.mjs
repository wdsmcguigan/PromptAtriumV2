#!/usr/bin/env node
/**
 * Detects the license of a GitHub repo and maps it to a PromptAtrium license code.
 *
 * Usage:
 *   GITHUB_TOKEN=ghp_... node license-detector.mjs owner/repo
 *
 * Exit codes:
 *   0 — eligible (cc0, cc-by-4.0, cc-by-sa-4.0, mit)
 *   1 — script error
 *   2 — ineligible (arr, NC/ND)
 *   3 — needs human review (unknown redistributable license)
 */

const [,, REPO] = process.argv;
const TOKEN = process.env.GITHUB_TOKEN;

if (!REPO || !REPO.includes('/')) {
  console.error('Usage: GITHUB_TOKEN=... node license-detector.mjs owner/repo');
  process.exit(1);
}

const headers = {
  'Accept': 'application/vnd.github+json',
  'User-Agent': 'PromptAtrium-harvester/1.0',
  ...(TOKEN ? { 'Authorization': `Bearer ${TOKEN}` } : {}),
};

function mapSpdx(spdx, name) {
  if (!spdx || spdx === 'NOASSERTION') {
    return { code: 'arr', spdx: null, eligible: false, notes: 'No license detected — default all rights reserved' };
  }

  const u = spdx.toUpperCase();

  if (u === 'CC0-1.0' || u === 'CC0')           return { code: 'cc0',        spdx, eligible: true };
  if (u === 'CC-BY-4.0')                         return { code: 'cc-by-4.0',  spdx, eligible: true };
  if (u === 'CC-BY-SA-4.0')                      return { code: 'cc-by-sa-4.0', spdx, eligible: true };
  if (u === 'MIT' || u === 'MIT-0')              return { code: 'mit',        spdx, eligible: true };
  if (u === 'APACHE-2.0')                        return { code: 'apache-2.0', spdx, eligible: true };
  if (u === 'BSD-2-CLAUSE' || u === 'BSD-3-CLAUSE' || u === 'ISC') {
    return { code: null, spdx, eligible: null, notes: `${spdx} is redistributable but has no exact registry code — add one to @shared/licenses before ingesting; never relabel as mit` };
  }
  if (u.startsWith('CC-BY-NC') || u.startsWith('CC-BY-ND')) {
    return { code: 'arr', spdx, eligible: false, notes: 'NC/ND variant — ineligible for redistribution' };
  }
  if (u.includes('-NC-') || u.includes('-ND-')) {
    return { code: 'arr', spdx, eligible: false, notes: 'NC/ND variant — ineligible' };
  }
  if (u === 'UNLICENSED' || u === 'SEE-LICENSE-IN-FILE') {
    return { code: 'arr', spdx: null, eligible: false, notes: `"${spdx}" — treat as all rights reserved` };
  }

  // Unknown but possibly redistributable — flag for human review
  return { code: spdx, spdx, eligible: null, notes: 'Unlisted license — human review required before ingesting' };
}

async function run() {
  const res = await fetch(`https://api.github.com/repos/${REPO}`, { headers });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();

  const spdx  = data.license?.spdx_id;
  const lname = data.license?.name;
  const result = mapSpdx(spdx, lname);

  const output = {
    repo: REPO,
    github_license_name: lname ?? null,
    ...result,
  };

  console.log(JSON.stringify(output, null, 2));

  if (result.eligible === false) process.exit(2);
  if (result.eligible === null)  process.exit(3);
  // eligible === true → exit 0
}

run().catch(err => {
  console.error(err.message);
  process.exit(1);
});
