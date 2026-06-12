import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import type { User } from "@workspace/db";

// Generic OIDC auth (Google by default). Replaces the Replit Auth integration
// while keeping the exact session shape the rest of the server depends on:
// req.user = { claims: { sub: <users.id>, ... }, expires_at } — ~135 call
// sites read req.user.claims.sub as the database user id, so `sub` is always
// rewritten to the local users.id, never the provider's subject.

const OIDC_ISSUER_URL = process.env.OIDC_ISSUER_URL ?? "https://accounts.google.com";

// Sessions are validated locally for this long; provider tokens are not
// stored or refreshed (no offline_access scope is requested).
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 1 week

export function getAppUrl(): string {
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/$/, "");
  }
  const port = process.env.PORT ?? "8080";
  return `http://localhost:${port}`;
}

let _oidcConfigCache: { value: client.Configuration; expiresAt: number } | null = null;
const getOidcConfig = async (): Promise<client.Configuration> => {
  const now = Date.now();
  if (_oidcConfigCache && _oidcConfigCache.expiresAt > now) {
    return _oidcConfigCache.value;
  }
  if (!process.env.OIDC_CLIENT_ID || !process.env.OIDC_CLIENT_SECRET) {
    throw new Error(
      "OIDC_CLIENT_ID and OIDC_CLIENT_SECRET must be set. See AUTH_SETUP.md.",
    );
  }
  const value = await client.discovery(
    new URL(OIDC_ISSUER_URL),
    process.env.OIDC_CLIENT_ID,
    process.env.OIDC_CLIENT_SECRET,
  );
  _oidcConfigCache = { value, expiresAt: now + 3600 * 1000 };
  return value;
};

export function getSession() {
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: SESSION_TTL_MS,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      // secure cookies break plain-http localhost; only require them in prod
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_TTL_MS,
    },
  });
}

/**
 * Maps a verified OIDC identity onto a local user row.
 *
 * Identity continuity rules (do not weaken these):
 * - Users are matched by verified email, case-insensitively — never by the
 *   provider's `sub`. Pre-existing users keep their original users.id so
 *   prompts, orders, and ledger rows stay attached across auth providers.
 * - Provider profile data only fills EMPTY fields; it never overwrites
 *   values the user customized in the app.
 * - Logins without a verified email are rejected.
 */
export async function findOrCreateUser(claims: Record<string, unknown>): Promise<User> {
  const email = typeof claims.email === "string" ? claims.email : undefined;
  if (!email) {
    throw new Error("OIDC login rejected: no email claim present");
  }
  if (claims.email_verified === false) {
    throw new Error("OIDC login rejected: email is not verified");
  }

  const firstName =
    (claims.given_name as string | undefined) ?? (claims.first_name as string | undefined);
  const lastName =
    (claims.family_name as string | undefined) ?? (claims.last_name as string | undefined);
  const profileImageUrl =
    (claims.picture as string | undefined) ?? (claims.profile_image_url as string | undefined);

  const existing = await storage.getUserByEmail(email);
  if (existing) {
    const fill: Partial<User> = {};
    if (!existing.firstName && firstName) fill.firstName = firstName;
    if (!existing.lastName && lastName) fill.lastName = lastName;
    if (!existing.profileImageUrl && profileImageUrl) fill.profileImageUrl = profileImageUrl;
    if (Object.keys(fill).length > 0) {
      return await storage.updateUser(existing.id, fill);
    }
    return existing;
  }

  // New user: no explicit id — the users.id column default gen_random_uuid()
  // applies. upsertUser also auto-joins the General community.
  return await storage.upsertUser({
    email,
    firstName,
    lastName,
    profileImageUrl,
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback,
  ) => {
    try {
      const claims = tokens.claims();
      if (!claims) {
        return verified(new Error("No claims in token response"));
      }
      const dbUser = await findOrCreateUser(claims as Record<string, unknown>);
      const sessionUser = {
        claims: { ...claims, sub: dbUser.id },
        expires_at: Math.floor((Date.now() + SESSION_TTL_MS) / 1000),
      };
      verified(null, sessionUser);
    } catch (error) {
      verified(error as Error);
    }
  };

  const strategy = new Strategy(
    {
      name: "oidc",
      config,
      scope: "openid email profile",
      callbackURL: `${getAppUrl()}/api/callback`,
    },
    verify,
  );
  passport.use(strategy);

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    passport.authenticate("oidc", {
      prompt: "select_account",
      scope: ["openid", "email", "profile"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    passport.authenticate("oidc", {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      req.session.destroy(() => {
        res.redirect("/");
      });
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user?.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  // No provider tokens are stored, so an expired session can't be refreshed —
  // the user just signs in again.
  res.status(401).json({ message: "Unauthorized" });
};
