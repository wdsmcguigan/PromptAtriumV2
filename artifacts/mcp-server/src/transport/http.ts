import { randomUUID } from "node:crypto";
import express, {
  Router,
  type Express,
  type Request,
  type RequestHandler,
  type Response,
  type Router as RouterType,
} from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { HttpPromptAtriumClient } from "../client.js";
import { createMcpServer } from "../core/server.js";

// Remote mode: Streamable HTTP on a single `/mcp` path (POST + GET + DELETE),
// never HTTP+SSE. All transport wiring is isolated in this file so the
// ~2026-07-28 SDK v2 split is a one-file migration. Auth is the caller's PAT,
// shaped as an OAuth 2.1 resource server: a 401 carries `WWW-Authenticate` and
// the RFC 9728 metadata is served so the later OAuth upgrade is purely additive.

export interface McpHttpOptions {
  /** Upstream PromptAtrium API base, e.g. https://promptatrium.com. */
  apiBaseUrl: string;
  /**
   * Public URL of this MCP endpoint, used as the RFC 9728 `resource` and in
   * `WWW-Authenticate`. Defaults to inferring it from the request.
   */
  resourceUrl?: string;
  /** Path the MCP endpoint is served on. Default `/mcp`. */
  mcpPath?: string;
  /**
   * Allowed `Origin` values. When set, a request with an Origin not on the
   * list is rejected with 403 (browser DNS-rebinding defense). When omitted,
   * Origin is not enforced (non-browser clients send none).
   */
  allowedOrigins?: string[];
  logger?: (message: string) => void;
}

function metadataPath(mcpPath: string): string {
  // RFC 9728 allows a path-suffixed resource metadata document; keep it aligned
  // with the protected resource's path so multiple resources can coexist.
  return mcpPath === "/" || mcpPath === ""
    ? "/.well-known/oauth-protected-resource"
    : `/.well-known/oauth-protected-resource${mcpPath}`;
}

function resolveResourceUrl(req: Request, opts: McpHttpOptions): string {
  if (opts.resourceUrl) return opts.resourceUrl;
  const proto = (req.headers["x-forwarded-proto"] as string | undefined) ?? req.protocol;
  const host = req.headers.host ?? "localhost";
  return `${proto}://${host}${opts.mcpPath ?? "/mcp"}`;
}

// Mount the MCP endpoint + its OAuth-protected-resource metadata onto an
// existing Express app or router (e.g. @workspace/api-server). Standalone
// servers use `createMcpHttpApp`, which wraps this.
export function mountMcpServer(
  app: RouterType,
  opts: McpHttpOptions,
): void {
  const mcpPath = opts.mcpPath ?? "/mcp";
  const log = opts.logger ?? (() => {});
  // sessionId -> live transport. Sessions are best-effort: the design never
  // *requires* Mcp-Session-Id, but honoring it lets resumable clients reuse a
  // connection (and is how GET/DELETE address a stream).
  const transports = new Map<string, StreamableHTTPServerTransport>();

  // --- RFC 9728: protected-resource metadata (stub; OAuth AS is a follow-up) -
  app.get(metadataPath(mcpPath), (req: Request, res: Response) => {
    res.json({
      resource: resolveResourceUrl(req, opts),
      // No authorization server yet — PAT bearer is the v1 path. The OAuth
      // follow-up populates this without breaking existing PAT configs.
      authorization_servers: [],
      bearer_methods_supported: ["header"],
      scopes_supported: ["read", "write"],
      resource_documentation: `${opts.apiBaseUrl.replace(/\/+$/, "")}/docs/mcp`,
    });
  });

  // --- Origin allowlist (403) ---------------------------------------------
  const originGuard: RequestHandler = (req, res, next) => {
    const origin = req.headers.origin;
    if (origin && opts.allowedOrigins && !opts.allowedOrigins.includes(origin)) {
      res.status(403).json({ error: "Forbidden: origin not allowed" });
      return;
    }
    next();
  };

  // --- Bearer auth: extract PAT, 401 + WWW-Authenticate when absent --------
  const requireBearer: RequestHandler = (req, res, next) => {
    const header = req.headers.authorization;
    const token =
      header && header.startsWith("Bearer ") ? header.slice(7).trim() : "";
    if (!token) {
      const meta = `${resolveResourceUrl(req, opts).replace(
        mcpPath,
        "",
      )}${metadataPath(mcpPath)}`;
      res
        .status(401)
        .set(
          "WWW-Authenticate",
          `Bearer resource_metadata="${meta}"`,
        )
        .json({ error: "Unauthorized: missing bearer token" });
      return;
    }
    (req as Request & { patToken?: string }).patToken = token;
    next();
  };

  const jsonBody = express.json({ limit: "4mb" });

  // POST /mcp — JSON-RPC requests. New session on `initialize`, reuse otherwise.
  app.post(
    mcpPath,
    originGuard,
    requireBearer,
    jsonBody,
    async (req: Request, res: Response) => {
      try {
        const sessionId = req.headers["mcp-session-id"] as string | undefined;
        let transport = sessionId ? transports.get(sessionId) : undefined;

        if (!transport) {
          if (sessionId || !isInitializeRequest(req.body)) {
            res.status(400).json({
              jsonrpc: "2.0",
              error: { code: -32000, message: "Bad Request: no valid session" },
              id: null,
            });
            return;
          }
          // Per-session server factory, closing over this request's PAT.
          const token = (req as Request & { patToken?: string }).patToken!;
          const client = new HttpPromptAtriumClient({
            baseUrl: opts.apiBaseUrl,
            token,
          });
          transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
            onsessioninitialized: (sid) => {
              transports.set(sid, transport!);
              log(`session opened: ${sid}`);
            },
          });
          transport.onclose = () => {
            if (transport!.sessionId) {
              transports.delete(transport!.sessionId);
              log(`session closed: ${transport!.sessionId}`);
            }
          };
          const server = await createMcpServer({ client, logger: log });
          await server.connect(transport);
        }

        await transport.handleRequest(req, res, req.body);
      } catch (err) {
        log(`POST ${mcpPath} error: ${(err as Error).stack ?? String(err)}`);
        if (!res.headersSent) {
          res.status(500).json({
            jsonrpc: "2.0",
            error: { code: -32603, message: "Internal server error" },
            id: null,
          });
        }
      }
    },
  );

  // GET /mcp — SSE stream for server→client notifications (session-addressed).
  // DELETE /mcp — explicit session teardown. Both require an existing session.
  const sessionRequest: RequestHandler = async (req, res) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    const transport = sessionId ? transports.get(sessionId) : undefined;
    if (!transport) {
      res.status(400).json({ error: "Invalid or missing session ID" });
      return;
    }
    await transport.handleRequest(req, res);
  };
  app.get(mcpPath, originGuard, requireBearer, sessionRequest);
  app.delete(mcpPath, originGuard, requireBearer, sessionRequest);
}

// Build a standalone Express app serving only the MCP endpoint.
export function createMcpHttpApp(opts: McpHttpOptions): Express {
  const app = express();
  mountMcpServer(app, opts);
  return app;
}

// Convenience router for callers that prefer mounting a Router.
export function createMcpRouter(opts: McpHttpOptions): RouterType {
  const router = Router();
  mountMcpServer(router, { ...opts, mcpPath: opts.mcpPath ?? "/" });
  return router;
}
