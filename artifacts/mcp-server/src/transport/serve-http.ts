#!/usr/bin/env node
import { createMcpHttpApp } from "./http.js";

// Standalone hosted endpoint. In production this can run as its own process or
// be mounted into @workspace/api-server via `mountMcpServer(app, …)`. Config is
// env-driven so no secrets are baked into the image.

function log(message: string): void {
  process.stderr.write(`[promptatrium-mcp:http] ${message}\n`);
}

const port = Number(process.env["PORT"] ?? 8090);
const apiBaseUrl =
  process.env["PROMPTATRIUM_API_URL"] ?? "http://127.0.0.1:8080";
const allowedOrigins = process.env["MCP_ALLOWED_ORIGINS"]
  ? process.env["MCP_ALLOWED_ORIGINS"].split(",").map((s) => s.trim())
  : undefined;

const app = createMcpHttpApp({
  apiBaseUrl,
  resourceUrl: process.env["MCP_RESOURCE_URL"],
  allowedOrigins,
  logger: log,
});

app.listen(port, () => {
  log(`listening on :${port} → upstream ${apiBaseUrl}`);
});
