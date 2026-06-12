-- Custom SQL migration file, put your code below! --

-- Seed the asset kind registry. New kinds are INSERTs like these — never
-- schema migrations. capabilities.content: 'inline' (single text body),
-- 'bundle' (multi-file), or 'manifest' (composition of other assets).
INSERT INTO "asset_kinds" ("id", "display_name", "description", "capabilities") VALUES
  ('prompt', 'Prompt', 'A reusable prompt — the seed of everything', '{"content": "inline"}'),
  ('system_prompt', 'System Prompt', 'Persistent instructions that shape an AI''s behavior across a conversation', '{"content": "inline"}'),
  ('rule', 'Rule', 'A rules/instructions file injected into a tool (CLAUDE.md, .cursor/rules, AGENTS.md, ...)', '{"content": "inline"}'),
  ('skill', 'Skill', 'A packaged capability: SKILL.md plus supporting files', '{"content": "bundle"}'),
  ('workflow', 'Workflow', 'A multi-step AI process definition', '{"content": "bundle"}'),
  ('stack', 'Stack', 'A composition of assets, deployable as a unit', '{"content": "manifest"}')
ON CONFLICT ("id") DO NOTHING;
