// Manual HTTP smoke test for the v2 router (not part of the server build).
// Needs a scratch DB with legacy schema + v2 migrations + seeded users
// 'user-alice'/'user-bob' run through backfill-v2 first. Build & run:
//   pnpm exec esbuild src/scripts/v2-smoke.ts --bundle --platform=node \
//     --format=esm --outfile=dist/scripts/v2-smoke.mjs --external:pg-native \
//     --banner:js="import { createRequire as __cr } from 'node:module'; globalThis.require = __cr(import.meta.url);"
//   DATABASE_URL=... node dist/scripts/v2-smoke.mjs
import express from "express";
import { eq } from "drizzle-orm";
import { apiTokens, principals } from "@workspace/db";
import { db, pool } from "../db";
import v2Router from "../v2/routes";
import { hashToken } from "../v2/ids";

const PAT = "pat_smoketestsmoketestsmoketestsmoketest1";

async function main() {
  const [principal] = await db
    .select()
    .from(principals)
    .where(eq(principals.userId, "user-alice"));
  if (!principal) throw new Error("run backfill first");
  await db
    .insert(apiTokens)
    .values({
      principalId: principal.id,
      name: "smoke",
      tokenHash: hashToken(PAT),
      scopes: ["read", "write"],
    })
    .onConflictDoNothing();

  const app = express();
  app.use(express.json());
  app.use("/api/v2", v2Router);
  const server = app.listen(8099);

  const call = async (
    method: string,
    path: string,
    body?: unknown,
    auth: string | null = PAT,
  ) => {
    const res = await fetch(`http://localhost:8099/api/v2${path}`, {
      method,
      headers: {
        "content-type": "application/json",
        ...(auth !== null ? { authorization: `Bearer ${auth}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const text = await res.text();
    return { status: res.status, body: text ? JSON.parse(text) : null };
  };

  const results: string[] = [];
  const check = (name: string, ok: boolean, detail?: unknown) => {
    results.push(`${ok ? "PASS" : "FAIL"} ${name}${ok ? "" : ` — ${JSON.stringify(detail)}`}`);
  };

  let r = await call("GET", "/kinds", undefined, null);
  check("401 without auth", r.status === 401, r);

  r = await call("GET", "/kinds", undefined, "pat_wrongwrongwrong");
  check("401 with bad PAT", r.status === 401, r);

  r = await call("GET", "/kinds");
  check("kinds lists active kinds", r.status === 200 && r.body.length === 7, r);

  r = await call("POST", "/assets", {
    kindId: "rule",
    name: "Smoke Rule",
    visibility: "public",
    tags: ["smoke"],
    content: { text: "Never deploy on Fridays." },
  });
  check("create asset + v1", r.status === 201 && r.body.headVersion?.versionNumber === 1, r);
  check("default license is cc0", r.body.license === "cc0", r);
  const publicId = r.body.publicId as string;

  r = await call("POST", "/assets", { kindId: "nope", name: "x" });
  check("unknown kind rejected", r.status === 400, r);

  r = await call("GET", `/assets/${publicId}`);
  check("get asset by public id", r.status === 200 && r.body.headVersion.contentText.includes("Fridays"), r);

  r = await call("POST", `/assets/${publicId}/versions`, {
    content: { text: "Never deploy on Fridays. Or Mondays." },
    changelog: "expanded",
  });
  check("new version is v2", r.status === 201 && r.body.versionNumber === 2, r);

  r = await call("GET", `/assets/${publicId}/versions`);
  check("versions listed desc", r.status === 200 && r.body[0].versionNumber === 2 && r.body.length === 2, r);

  r = await call("PATCH", `/assets/${publicId}`, { license: "arr" });
  check("patch license", r.status === 200 && r.body.license === "arr", r);
  r = await call("PATCH", `/assets/${publicId}`, { license: "GPL-9" });
  check("unknown license rejected", r.status === 400, r);

  r = await call("PUT", `/assets/${publicId}/star`);
  check("star", r.status === 200 && r.body.starCount === 1, r);
  r = await call("PUT", `/assets/${publicId}/star`);
  check("star is idempotent", r.status === 200 && r.body.starCount === 1, r);
  r = await call("DELETE", `/assets/${publicId}/star`);
  check("unstar", r.status === 200 && r.body.starCount === 0, r);

  r = await call("POST", "/assets", { kindId: "stack", name: "Smoke Stack" });
  const stackId = r.body.publicId as string;
  r = await call("POST", `/assets/${stackId}/edges`, { childPublicId: publicId });
  check("add edge", r.status === 201 && r.body.role === "item", r);
  r = await call("POST", `/assets/${stackId}/edges`, { childPublicId: publicId });
  check("duplicate edge 409", r.status === 409, r);
  r = await call("GET", `/assets/${stackId}/edges`);
  check("list edges with child info", r.status === 200 && r.body[0].child.publicId === publicId, r);

  r = await call("GET", "/assets?kind=rule&q=smoke");
  check("list with filters", r.status === 200 && r.body.items.length === 1, r);

  r = await call("POST", "/tokens", { name: "evil" });
  check("PAT cannot mint PATs", r.status === 403, r);

  r = await call("DELETE", `/assets/${stackId}`);
  check("archive 204", r.status === 204, r);
  r = await call("GET", "/assets");
  check("archived asset hidden from list", r.status === 200 && !r.body.items.some((a: { publicId: string }) => a.publicId === stackId), r);

  // private asset of another principal is invisible
  const [bob] = await db.select().from(principals).where(eq(principals.userId, "user-bob"));
  const bobPat = "pat_bobsmoketestbobsmoketestbobsmoketest1";
  await db.insert(apiTokens).values({
    principalId: bob!.id,
    name: "smoke-bob",
    tokenHash: hashToken(bobPat),
    scopes: ["read"],
  }).onConflictDoNothing();
  const privateAssets = await call("GET", "/assets?visibility=private");
  const privateId = privateAssets.body.items[0]?.publicId;
  r = await call("GET", `/assets/${privateId}`, undefined, bobPat);
  check("other's private asset is 404", r.status === 404, r);
  r = await call("POST", "/assets", { kindId: "prompt", name: "x" }, bobPat);
  check("read-only scope cannot write", r.status === 403, r);

  console.log(results.join("\n"));
  server.close();
  await pool.end();
  if (results.some((l) => l.startsWith("FAIL"))) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
