// promptatrium-mcp — an MCP server over the PromptAtrium v2 asset store.
//
// Two modes from one codebase: a local stdio server (`promptatrium-mcp` bin,
// see ./transport/stdio.ts) and a hosted Streamable HTTP endpoint
// (./transport/http.ts, mountable into @workspace/api-server or standalone).
// The transport-agnostic core lives in ./core/server.ts.

export { createMcpServer, SERVER_NAME, SERVER_VERSION } from "./core/server.js";
export type { McpServerContext } from "./core/server.js";

export {
  mountMcpServer,
  createMcpHttpApp,
  createMcpRouter,
} from "./transport/http.js";
export type { McpHttpOptions } from "./transport/http.js";

export {
  HttpPromptAtriumClient,
  PromptAtriumApiError,
} from "./client.js";
export type {
  PromptAtriumClient,
  AssetSummary,
  AssetDetail,
  AssetVersion,
  ListAssetsOptions,
  HttpClientOptions,
} from "./client.js";
