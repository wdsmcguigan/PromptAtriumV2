import { defineConfig } from "drizzle-kit";

// v2 schema only: migrations are generated against src/schema/v2.ts and
// never touch the legacy tables in schema.ts (those stay frozen; see
// docs/plans/phase-1-schema-v2.md). Paths are relative to lib/db, where the
// pnpm scripts run.
export default defineConfig({
  schema: "./src/schema/v2.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
