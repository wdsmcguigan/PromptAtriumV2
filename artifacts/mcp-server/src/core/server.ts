import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type {
  AssetDetail,
  AssetSummary,
  AssetVersion,
  PromptAtriumClient,
} from "../client.js";
import {
  buildAssetUri,
  buildSkillUri,
  isSkillKind,
  mimeForKind,
  parseAssetName,
} from "./uris.js";

// The package version is stamped here and kept in step with package.json; the
// build does not inject it, so update both together on release.
export const SERVER_NAME = "promptatrium-mcp";
export const SERVER_VERSION = "0.1.0";

export interface McpServerContext {
  client: PromptAtriumClient;
  /** Diagnostics sink. stdio MUST log to stderr (stdout is the JSON-RPC pipe). */
  logger?: (message: string) => void;
}

// Pull a single file's text out of a version, covering both the inline-bundle
// fast path (`contentFiles: [{ path, text }]`) and single-text assets.
function fileText(version: AssetVersion | null, path: string): string | null {
  if (!version) return null;
  if (Array.isArray(version.contentFiles)) {
    for (const file of version.contentFiles) {
      if (file && file["path"] === path && typeof file["text"] === "string") {
        return file["text"] as string;
      }
    }
  }
  if (path === "SKILL.md" && typeof version.contentText === "string") {
    return version.contentText;
  }
  return null;
}

// The canonical body for a non-skill asset is its version's text.
function bodyText(detail: AssetDetail): string {
  return detail.headVersion?.contentText ?? "";
}

function lastModified(asset: { updatedAt: string }): string {
  return asset.updatedAt;
}

// One resource_link / resource descriptor for an asset summary.
function resourceLinkFor(asset: AssetSummary) {
  const skill = isSkillKind(asset.kindId);
  const uri = skill
    ? buildSkillUri(asset.ownerHandle, asset.slug)
    : buildAssetUri(asset.ownerHandle, asset.slug);
  return {
    type: "resource_link" as const,
    uri,
    name: asset.slug,
    title: asset.name,
    description: asset.description ?? undefined,
    mimeType: skill ? "text/markdown" : mimeForKind(asset.kindId),
  };
}

// Build the server. Async because prompt-kind assets are registered as MCP
// prompts up front (the SDK has no dynamic prompt-list callback); a failure to
// enumerate them is logged and skipped, never fatal.
export async function createMcpServer(
  ctx: McpServerContext,
): Promise<McpServer> {
  const { client } = ctx;
  const log = ctx.logger ?? (() => {});

  const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION },
    { capabilities: { resources: { listChanged: true }, tools: {}, prompts: {} } },
  );

  // ---- Tools: the universal hedge (work on every client) -----------------

  server.registerTool(
    "list_assets",
    {
      title: "List PromptAtrium assets",
      description:
        "List the caller's available assets (rules, skills, commands, prompts, mcp-server configs). Returns resource_link items addressable via asset:// or skill:// URIs.",
      inputSchema: {
        kind: z
          .enum(["rule", "skill", "command", "prompt", "mcp-server"])
          .optional()
          .describe("Optional filter by asset kind."),
        query: z
          .string()
          .optional()
          .describe("Optional free-text filter over name and description."),
      },
    },
    async ({ kind, query }) => {
      const items = await client.listAssets({ kind, query });
      const links = items.map(resourceLinkFor);
      return {
        content: [
          {
            type: "text" as const,
            text: items.length
              ? `${items.length} asset(s).`
              : "No assets found.",
          },
          ...links,
        ],
      };
    },
  );

  server.registerTool(
    "get_asset",
    {
      title: "Get a PromptAtrium asset",
      description:
        "Fetch the full content of one asset by name ('owner/slug'), optionally pinned to an integer version. Returns the asset body as an embedded resource plus a resource_link. Defaults to the latest version.",
      inputSchema: {
        name: z
          .string()
          .describe("Asset identifier in 'owner/slug' form, e.g. 'promptatrium/pr-review-rules'."),
        version: z
          .number()
          .int()
          .positive()
          .optional()
          .describe("Optional integer version (e.g. 3). Defaults to the latest version."),
      },
    },
    async ({ name, version }) => {
      const parsed = parseAssetName(name);
      if (!parsed) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Invalid asset name '${name}'. Use 'owner/slug', e.g. 'promptatrium/pr-review-rules'.`,
            },
          ],
        };
      }
      const detail = await client.getAsset(parsed.handle, parsed.slug, version);
      if (!detail) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Asset '${name}'${version ? ` v/${version}` : ""} not found or not accessible.`,
            },
          ],
        };
      }
      const skill = isSkillKind(detail.kindId);
      const versionNumber = detail.headVersion?.versionNumber;
      const uri = skill
        ? buildSkillUri(detail.ownerHandle, detail.slug)
        : buildAssetUri(detail.ownerHandle, detail.slug, version);
      const text = skill
        ? fileText(detail.headVersion, "SKILL.md") ?? bodyText(detail)
        : bodyText(detail);
      return {
        content: [
          {
            type: "resource" as const,
            resource: {
              uri,
              mimeType: skill ? "text/markdown" : mimeForKind(detail.kindId),
              text,
            },
          },
          {
            type: "resource_link" as const,
            uri: skill
              ? buildSkillUri(detail.ownerHandle, detail.slug)
              : buildAssetUri(detail.ownerHandle, detail.slug),
            name: detail.slug,
            title:
              versionNumber !== undefined
                ? `${detail.name} (v${versionNumber})`
                : detail.name,
            mimeType: skill ? "text/markdown" : mimeForKind(detail.kindId),
          },
        ],
      };
    },
  );

  // ---- Resources: asset:// templates + the skill:// scheme ---------------

  // Enumerate the caller's assets as concrete resource URIs. Split between the
  // two templates so each kind lists once (skills under skill://, the rest
  // under asset://).
  async function listResources(skillOnly: boolean) {
    const items = await client.listAssets();
    const resources = items
      .filter((a) => isSkillKind(a.kindId) === skillOnly)
      .map((a) => {
        const link = resourceLinkFor(a);
        return {
          uri: link.uri,
          name: a.slug,
          title: a.name,
          description: a.description ?? undefined,
          mimeType: link.mimeType,
          annotations: {
            audience: ["assistant" as const],
            lastModified: lastModified(a),
          },
        };
      });
    return { resources };
  }

  // asset://{handle}/{slug} — latest version of a non-skill asset.
  server.registerResource(
    "asset",
    new ResourceTemplate("asset://{handle}/{slug}", {
      list: () => listResources(false),
    }),
    {
      title: "PromptAtrium asset",
      description: "A rule, command, prompt, or mcp-server config at its latest version.",
    },
    async (uri, variables) => {
      const handle = String(variables["handle"]);
      const slug = String(variables["slug"]);
      const detail = await client.getAsset(handle, slug);
      if (!detail) throw new Error(`Asset not found: ${handle}/${slug}`);
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: mimeForKind(detail.kindId),
            text: bodyText(detail),
          },
        ],
      };
    },
  );

  // asset://{handle}/{slug}/v/{version} — a pinned integer version (immutable).
  server.registerResource(
    "asset-version",
    new ResourceTemplate("asset://{handle}/{slug}/v/{version}", {
      list: undefined,
    }),
    {
      title: "PromptAtrium asset (pinned version)",
      description: "A specific immutable integer version of an asset.",
    },
    async (uri, variables) => {
      const handle = String(variables["handle"]);
      const slug = String(variables["slug"]);
      const version = Number(variables["version"]);
      const detail = await client.getAsset(
        handle,
        slug,
        Number.isFinite(version) ? version : undefined,
      );
      if (!detail) throw new Error(`Asset not found: ${handle}/${slug}/v/${variables["version"]}`);
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: mimeForKind(detail.kindId),
            text: bodyText(detail),
          },
        ],
      };
    },
  );

  // skill://{handle}/{slug}/{+filePath} — SEP-2640 scheme over Resources.
  // Defaults to SKILL.md; other bundled files resolve by path.
  server.registerResource(
    "skill",
    new ResourceTemplate("skill://{handle}/{slug}/{+filePath}", {
      list: () => listResources(true),
    }),
    {
      title: "PromptAtrium skill (SEP-2640)",
      description: "A skill bundle served over the experimental skill:// scheme.",
    },
    async (uri, variables) => {
      const handle = String(variables["handle"]);
      const slug = String(variables["slug"]);
      const filePath = String(variables["filePath"] ?? "SKILL.md");
      const detail = await client.getAsset(handle, slug);
      if (!detail) throw new Error(`Skill not found: ${handle}/${slug}`);
      const text = fileText(detail.headVersion, filePath);
      if (text === null) {
        throw new Error(`File not found in skill ${handle}/${slug}: ${filePath}`);
      }
      return {
        contents: [{ uri: uri.href, mimeType: "text/markdown", text }],
      };
    },
  );

  // ---- Prompts: prompt-kind assets exposed as MCP prompts (slash commands) -

  try {
    const prompts = await client.listAssets({ kind: "prompt" });
    for (const prompt of prompts) {
      // The MCP prompt name is the slug; collisions across owners are out of
      // scope for v1 (the caller only sees their own + public prompts).
      server.registerPrompt(
        prompt.slug,
        {
          title: prompt.name,
          description: prompt.description ?? undefined,
        },
        async () => {
          const detail = await client.getAsset(prompt.ownerHandle, prompt.slug);
          const text = detail ? bodyText(detail) : "";
          return {
            messages: [
              {
                role: "user" as const,
                content: { type: "text" as const, text },
              },
            ],
          };
        },
      );
    }
  } catch (err) {
    log(`Skipping prompt registration: ${(err as Error).message}`);
  }

  return server;
}
