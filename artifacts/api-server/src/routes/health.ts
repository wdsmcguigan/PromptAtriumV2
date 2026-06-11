import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { HealthCheckResponse } from "@workspace/api-zod";
import { db } from "../db";

const router: IRouter = Router();

// Liveness: process is up (no dependencies checked).
router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

// Readiness: verifies database connectivity, for platform health checks.
// Registered before the session middleware, so probes never create sessions.
router.get("/health", async (_req, res) => {
  try {
    await db.execute(sql`SELECT 1`);
    res.json({ status: "ok" });
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(503).json({ status: "unavailable" });
  }
});

export default router;
