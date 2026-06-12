// URI scheme helpers shared by the resource templates and the tool hedge.
//
// Non-skill assets are addressed `asset://{handle}/{slug}` (and the pinned
// `asset://{handle}/{slug}/v/{version}`); skill-kind assets follow the
// experimental SEP-2640 `skill://{handle}/{slug}/SKILL.md` scheme. Versions are
// monotonic integers (Phase 2 seam #2), never semver.

export const SKILL_KIND = "skill";

// mimeType by kind (appendix §2.1). mcp-server configs are JSON; everything else
// is markdown text. Skill bodies are markdown too, served via skill://.
export function mimeForKind(kindId: string): string {
  return kindId === "mcp-server" || kindId === "mcp_server"
    ? "application/json"
    : "text/markdown";
}

export function isSkillKind(kindId: string): boolean {
  return kindId === SKILL_KIND;
}

export function buildAssetUri(
  handle: string,
  slug: string,
  version?: number | undefined,
): string {
  const stem = `asset://${handle}/${slug}`;
  return version === undefined ? stem : `${stem}/v/${version}`;
}

export function buildSkillUri(
  handle: string,
  slug: string,
  filePath = "SKILL.md",
): string {
  return `skill://${handle}/${slug}/${filePath}`;
}

export interface ParsedAssetName {
  handle: string;
  slug: string;
  version?: number;
}

// Parse the `owner/slug` form accepted by get_asset (and the addressing half of
// asset:// URIs). Returns null on anything malformed so callers can return a
// tool-execution error rather than throwing.
export function parseAssetName(name: string): ParsedAssetName | null {
  const match = /^([^/]+)\/([^/@]+)$/.exec(name.trim());
  if (!match) return null;
  return { handle: match[1]!, slug: match[2]! };
}
