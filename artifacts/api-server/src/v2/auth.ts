import type { RequestHandler } from "express";
import { eq } from "drizzle-orm";
import { apiTokens, principals, users, type Principal } from "@workspace/db";
import { db } from "../db";
import { hashToken } from "./ids";
import { generateUniqueHandle } from "./handles";

// Everything in v2 acts as a principal (ownership indirection — see
// docs/plans/phase-1-schema-v2.md). A request is authenticated either by the
// web session (full access) or by a PAT bearer token (scoped; MCP/CLI).
export interface V2AuthContext {
  principal: Principal;
  scopes: string[];
  via: "session" | "token";
  tokenId?: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      v2?: V2AuthContext;
    }
  }
}

export async function getOrCreatePrincipalForUser(
  userId: string,
): Promise<Principal> {
  const [existing] = await db
    .select()
    .from(principals)
    .where(eq(principals.userId, userId));
  if (existing) return existing;

  // handle is required (Phase 2 seam #1): derive it from the legacy username
  // with a `user-<short-id>` fallback when there is none, matching migration
  // 0003's backfill.
  const [user] = await db
    .select({ username: users.username })
    .from(users)
    .where(eq(users.id, userId));
  const base = user?.username || `user-${userId.replace(/[^a-z0-9]/gi, "").slice(0, 8)}`;
  const handle = await generateUniqueHandle(base);

  const [created] = await db
    .insert(principals)
    .values({ kind: "user", userId, handle })
    .onConflictDoNothing({ target: principals.userId })
    .returning();
  if (created) return created;

  // Lost a creation race; the winner's row is there now.
  const [raced] = await db
    .select()
    .from(principals)
    .where(eq(principals.userId, userId));
  if (!raced) throw new Error(`Failed to create principal for user ${userId}`);
  return raced;
}

// last_used_at is advisory ("which of my tokens are dead?"), so it is written
// at most once per window and never blocks the request.
const LAST_USED_THROTTLE_MS = 5 * 60 * 1000;

export const requirePrincipal: RequestHandler = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (header) {
      if (!header.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const raw = header.slice("Bearer ".length).trim();
      if (!raw.startsWith("pat_")) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const [token] = await db
        .select()
        .from(apiTokens)
        .where(eq(apiTokens.tokenHash, hashToken(raw)));
      if (
        !token ||
        token.revokedAt ||
        (token.expiresAt && token.expiresAt.getTime() < Date.now())
      ) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const [principal] = await db
        .select()
        .from(principals)
        .where(eq(principals.id, token.principalId));
      if (!principal) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      req.v2 = {
        principal,
        scopes: token.scopes,
        via: "token",
        tokenId: token.id,
      };
      if (
        !token.lastUsedAt ||
        Date.now() - token.lastUsedAt.getTime() > LAST_USED_THROTTLE_MS
      ) {
        db.update(apiTokens)
          .set({ lastUsedAt: new Date() })
          .where(eq(apiTokens.id, token.id))
          .catch(() => {});
      }
      return next();
    }

    // No bearer token: fall back to the web session, mirroring the expiry
    // rules of the legacy isAuthenticated middleware.
    const sessionUser = req.user as
      | { claims?: { sub?: string }; expires_at?: number }
      | undefined;
    if (req.isAuthenticated?.() && sessionUser?.claims?.sub && sessionUser.expires_at) {
      const now = Math.floor(Date.now() / 1000);
      if (now <= sessionUser.expires_at) {
        const principal = await getOrCreatePrincipalForUser(
          sessionUser.claims.sub,
        );
        req.v2 = { principal, scopes: ["read", "write"], via: "session" };
        return next();
      }
    }
    return res.status(401).json({ message: "Unauthorized" });
  } catch (err) {
    next(err);
  }
};

export const requireScope =
  (scope: string): RequestHandler =>
  (req, res, next) => {
    if (!req.v2) return res.status(401).json({ message: "Unauthorized" });
    if (!req.v2.scopes.includes(scope)) {
      return res
        .status(403)
        .json({ message: `Token missing required scope: ${scope}` });
    }
    return next();
  };

// PATs must not be able to mint or revoke PATs.
export const requireSessionAuth: RequestHandler = (req, res, next) => {
  if (!req.v2) return res.status(401).json({ message: "Unauthorized" });
  if (req.v2.via !== "session") {
    return res
      .status(403)
      .json({ message: "Token management requires a browser session" });
  }
  return next();
};
