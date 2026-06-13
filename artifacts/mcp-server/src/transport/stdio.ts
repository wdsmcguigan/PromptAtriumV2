#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { HttpPromptAtriumClient } from "../client.js";
import { createMcpServer } from "../core/server.js";

// Local mode: `npx -y promptatrium-mcp`. The stdio server trusts the local OS
// user and reads the PAT from the environment only (never a flag — flags leak
// into process listings and shell history). stdout is the JSON-RPC pipe, so
// every diagnostic goes to stderr.

const DEFAULT_API_URL = "https://promptatrium.com";

function log(message: string): void {
  process.stderr.write(`[promptatrium-mcp] ${message}\n`);
}

async function main(): Promise<void> {
  const token = process.env["PROMPTATRIUM_TOKEN"];
  if (!token) {
    log(
      "PROMPTATRIUM_TOKEN is not set. Create a PAT (read scope) in PromptAtrium → Settings → Tokens and pass it via the PROMPTATRIUM_TOKEN env var.",
    );
    process.exit(1);
  }
  const baseUrl = process.env["PROMPTATRIUM_API_URL"] ?? DEFAULT_API_URL;

  const client = new HttpPromptAtriumClient({ baseUrl, token });
  const server = await createMcpServer({ client, logger: log });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  log(`connected (stdio) → ${baseUrl}`);
}

main().catch((err) => {
  log(`fatal: ${(err as Error).stack ?? String(err)}`);
  process.exit(1);
});
