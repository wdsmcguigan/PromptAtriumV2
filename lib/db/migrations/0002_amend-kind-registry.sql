-- Custom SQL migration file, put your code below! --

-- Amend the kind registry per research Brief 2 (context-injection formats
-- survey §5). Launch set is: rule, skill, command, prompt, mcp-server.
-- 'mcp-server' is hyphenated to match the planned @workspace/asset-core
-- AssetKind enum (docs/research/30-asset-sync-adapters.md); legacy
-- 'system_prompt' keeps its underscore slug.

INSERT INTO "asset_kinds" ("id", "display_name", "description", "capabilities") VALUES
  ('command', 'Command', 'A slash command: a named, argument-taking prompt template (.claude/commands/*.md and equivalents)', '{"content": "inline"}'),
  ('mcp-server', 'MCP Server', 'An MCP server configuration: package pointer, args, transport, env references (never secret values)', '{"content": "inline"}')
ON CONFLICT ("id") DO NOTHING;

-- Defer 'workflow' (survey §3: no portable cross-tool schema yet; revisit
-- when gh-aw exits preview). Soft-retire rather than delete.
UPDATE "asset_kinds" SET "is_active" = false WHERE "id" = 'workflow';

-- Sync-target mapping hints from survey §5(a)/(c). Adapter order reflects
-- the ranked launch targets: claude-code, cursor, copilot, codex, windsurf —
-- with agents-md as the lossless canonical emit for rules.
UPDATE "asset_kinds" SET "sync_targets" = '{
  "canonical": "agents-md",
  "targets": ["agents-md", "claude-code", "cursor", "copilot", "codex", "windsurf", "gemini-cli", "cline", "roo", "zed", "junie"]
}' WHERE "id" = 'rule';

UPDATE "asset_kinds" SET "sync_targets" = '{
  "canonical": "skill-md",
  "targets": ["claude-code", "vscode", "codex", "gemini-cli", "junie", "zed", "goose"]
}' WHERE "id" = 'skill';

UPDATE "asset_kinds" SET "sync_targets" = '{
  "targets": ["claude-code", "cursor"]
}' WHERE "id" = 'command';

UPDATE "asset_kinds" SET "sync_targets" = '{
  "targets": ["mcp-prompt", "hosted-instruction-field"]
}' WHERE "id" IN ('prompt', 'system_prompt');

UPDATE "asset_kinds" SET "sync_targets" = '{
  "canonical": "server-json",
  "targets": ["mcp-json", "claude-desktop", "vscode-mcp", "cursor-mcp", "windsurf-mcp"]
}' WHERE "id" = 'mcp-server';
