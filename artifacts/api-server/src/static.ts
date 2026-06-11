import express, { type Express } from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// In production the API server also serves the built SPA. The frontend build
// (artifacts/prompt-atrium/dist/public) is copied next to the server bundle
// as dist/public by the Dockerfile, or pointed to via STATIC_DIR.
export function getStaticDir(): string | null {
  const fromEnv = process.env.STATIC_DIR;
  if (fromEnv) {
    return path.resolve(fromEnv);
  }
  const candidates = [
    // next to the bundled server (dist/public)
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), "public"),
    // monorepo layout: sibling frontend build output
    path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      "../../prompt-atrium/dist/public",
    ),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, "index.html"))) {
      return dir;
    }
  }
  return null;
}

export function serveStatic(app: Express, staticDir: string): void {
  app.use(express.static(staticDir));

  // SPA fallback: anything that isn't an API or object route gets index.html.
  app.use((req, res, next) => {
    if (
      req.method !== "GET" ||
      req.path.startsWith("/api") ||
      req.path.startsWith("/objects")
    ) {
      return next();
    }
    res.sendFile(path.join(staticDir, "index.html"));
  });
}
