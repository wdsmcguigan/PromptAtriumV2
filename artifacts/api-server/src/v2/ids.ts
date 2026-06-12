import { createHash, randomBytes } from "node:crypto";

// Bitcoin-style base58: no 0/O/I/l, so ids survive being read aloud or
// retyped from a screenshot.
const BASE58_ALPHABET =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export function base58(length: number): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += BASE58_ALPHABET[bytes[i]! % BASE58_ALPHABET.length];
  }
  return out;
}

// Typed public ids (Stripe-style, design decision #4 in
// docs/plans/phase-1-schema-v2.md): the prefix makes ids self-describing in
// logs and bug reports.
export const newAssetPublicId = (): string => `a_${base58(12)}`;
export const newPatToken = (): string => `pat_${base58(40)}`;

// Only the hash is persisted; the plaintext PAT is shown once at creation.
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function computeContentHash(
  contentText: string | null | undefined,
  contentFiles: unknown,
): string {
  const h = createHash("sha256");
  if (contentText != null) {
    h.update("text:").update(contentText);
  } else {
    h.update("files:").update(JSON.stringify(contentFiles ?? null));
  }
  return h.digest("hex");
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
