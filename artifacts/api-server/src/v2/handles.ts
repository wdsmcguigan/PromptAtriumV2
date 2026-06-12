import { eq } from "drizzle-orm";
import { principals } from "@workspace/db";
import { db } from "../db";
import { base58, slugify } from "./ids";

// Principal handles are the URL-safe public address used by `asset://{handle}/…`,
// MCP, and profile URLs (Phase 2 seam #1). The migration backfills existing
// rows; these helpers keep newly created principals consistent with that scheme.

type DbConn = Pick<typeof db, "select">;

// A handle reuses the asset slug rules, then guarantees it is non-empty.
export function slugifyHandle(input: string | null | undefined): string {
  return slugify(input ?? "") || "user";
}

// Find a free handle from a desired base, suffixing on collision. The unique
// index on principals.handle is the ultimate guard; this just avoids predictable
// clashes (and the insert retries on the rare race).
export async function generateUniqueHandle(
  base: string,
  conn: DbConn = db,
): Promise<string> {
  const root = slugifyHandle(base);
  const candidates = [root];
  for (let i = 2; i <= 9; i++) candidates.push(`${root}-${i}`);
  for (const candidate of candidates) {
    const [existing] = await conn
      .select({ id: principals.id })
      .from(principals)
      .where(eq(principals.handle, candidate));
    if (!existing) return candidate;
  }
  // Heavily contested base: fall back to a random suffix (collision-proof
  // enough that the unique index rarely has to reject it).
  return `${root}-${base58(6).toLowerCase()}`;
}
