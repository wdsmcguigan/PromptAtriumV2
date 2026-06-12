// Canonical per-asset license registry. Single source of truth for the
// `prompts.license` enum, the picker UI, and badge/label rendering.
// Stored value is the `code`; labels/blurbs are rendered from this map.
// See docs/plans/31-license-picker-and-terms.md and
// docs/research/prompt-licensing-and-terms-memo.md.

export const LICENSE_CODES = [
  "cc0",
  "cc-by-4.0",
  "cc-by-sa-4.0",
  "mit",
  "arr",
] as const;

export type LicenseCode = (typeof LICENSE_CODES)[number];

export const DEFAULT_LICENSE: LicenseCode = "cc0";

export interface LicenseMeta {
  code: LicenseCode;
  label: string; // short label for picker + badge
  blurb: string; // one-line plain-language explanation
  url: string; // canonical license deed ("" for arr)
  allowsCopy: boolean; // false => suppress copy-to-library for this asset
}

export const LICENSES: Record<LicenseCode, LicenseMeta> = {
  "cc0": {
    code: "cc0",
    label: "CC0 1.0 (Public Domain)",
    blurb: "Anyone can use, change, or sell this — no credit needed.",
    url: "https://creativecommons.org/publicdomain/zero/1.0/",
    allowsCopy: true,
  },
  "cc-by-4.0": {
    code: "cc-by-4.0",
    label: "CC BY 4.0",
    blurb:
      "Free to use and remix, even commercially — as long as they credit you.",
    url: "https://creativecommons.org/licenses/by/4.0/",
    allowsCopy: true,
  },
  "cc-by-sa-4.0": {
    code: "cc-by-sa-4.0",
    label: "CC BY-SA 4.0",
    blurb: "Same as CC BY, but anyone's remix must use this same license.",
    url: "https://creativecommons.org/licenses/by-sa/4.0/",
    allowsCopy: true,
  },
  "mit": {
    code: "mit",
    label: "MIT",
    blurb:
      "Permissive; keep the copyright notice. Best when the asset is mostly code/config.",
    url: "https://opensource.org/license/mit",
    allowsCopy: true,
  },
  "arr": {
    code: "arr",
    label: "All Rights Reserved",
    blurb:
      "Viewable on PromptAtrium, but no one may copy it to their library or republish it.",
    url: "",
    allowsCopy: false,
  },
};

export const LICENSE_LIST: LicenseMeta[] = LICENSE_CODES.map(
  (c) => LICENSES[c],
);

// Map legacy display-string values (pre-migration) → codes. Tolerant of stragglers.
const LEGACY_LICENSE_MAP: Record<string, LicenseCode> = {
  "CC0 (Public Domain)": "cc0",
  "CC0": "cc0",
  "CC BY (Attribution)": "cc-by-4.0",
  "CC BY": "cc-by-4.0",
  "CC BY-SA (Share Alike)": "cc-by-sa-4.0",
  "CC BY-SA": "cc-by-sa-4.0",
  "All Rights Reserved": "arr",
};

export function isLicenseCode(value: string): value is LicenseCode {
  return (LICENSE_CODES as readonly string[]).includes(value);
}

/** Normalize any stored value (code | legacy string | null) to a known code. */
export function normalizeLicense(value?: string | null): LicenseCode {
  if (!value) return DEFAULT_LICENSE;
  if (isLicenseCode(value)) return value;
  return LEGACY_LICENSE_MAP[value] ?? DEFAULT_LICENSE;
}

/** Human-readable label for any stored value. Safe for display components. */
export function licenseLabel(value?: string | null): string {
  return LICENSES[normalizeLicense(value)].label;
}
