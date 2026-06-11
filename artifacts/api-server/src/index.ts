import app from "./app";
import { registerRoutes } from "./legacyRoutes";
import { logger } from "./lib/logger";
import { pool } from "./db";
import { getStaticDir, serveStatic } from "./static";
import { validateEnvironment, logValidationResults } from "./startup-validation";

process.on("uncaughtException", (err) => {
  logger.error({ err }, "Uncaught exception");
});

process.on("unhandledRejection", (reason) => {
  logger.error({ err: reason }, "Unhandled promise rejection");
});

const rawPort = process.env["PORT"] ?? "8080";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const validation = validateEnvironment();
logValidationResults(validation);
if (!validation.isValid && process.env.NODE_ENV === "production") {
  process.exit(1);
}

(async () => {
  const httpServer = await registerRoutes(app);

  // In production the API server also serves the built SPA. In development
  // the Vite dev server handles the frontend and proxies /api here.
  const staticDir = getStaticDir();
  if (staticDir) {
    logger.info({ staticDir }, "Serving frontend static files");
    serveStatic(app, staticDir);
  } else if (process.env.NODE_ENV === "production") {
    logger.warn(
      "No frontend build found (set STATIC_DIR or copy the prompt-atrium build to dist/public); serving API only",
    );
  }

  httpServer.listen(port, (err?: Error) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }

    logger.info({ port }, "Server listening");
  });

  const shutdown = (signal: string) => {
    logger.info(`${signal} received, shutting down gracefully`);
    httpServer.close(() => {
      pool.end().finally(() => process.exit(0));
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
})().catch((err) => {
  logger.error({ err }, "Failed to start server");
  process.exit(1);
});
