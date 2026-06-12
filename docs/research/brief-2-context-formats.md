# Research brief 2 — Survey of context-injection formats & sync targets

*Kickoff prompt for a deep-research agent. Self-contained; paste as-is.*

---

You are doing technical groundwork for **PromptAtrium**, a library for
"AI working set" assets (prompts, system prompts, skills, rules,
workflows) that will sync assets into the tools where people work, via an
MCP server and a CLI. To design its asset taxonomy and per-tool adapters
against reality, produce a precise, cited survey (current as of mid-2026)
of every significant context-injection format and convention:

1. **Per-tool instruction/rules files.** For each of: Claude Code
   (`CLAUDE.md`, `.claude/` dir, skills with `SKILL.md`, slash commands,
   hooks, MCP config), Cursor (`.cursor/rules/*.mdc`, legacy
   `.cursorrules`), `AGENTS.md` (the cross-tool standard — who honors it),
   GitHub Copilot (`.github/copilot-instructions.md`, path-scoped
   instructions), Windsurf, Cline/Roo, Aider, Zed, JetBrains AI, Codex
   CLI, Gemini CLI/`GEMINI.md` — document: exact file locations, format
   (frontmatter? globs? activation rules?), scoping (global/user/repo/
   directory), size limits, and how precedence/merging works.
2. **Packaged/bundled formats.** Claude Code skills (directory layout,
   SKILL.md frontmatter, allowed-tools), MCP **prompts** and **resources**
   (protocol-level shapes), Claude Projects / custom GPTs / Gemini Gems
   instruction fields and their limits, agent-framework templates
   (LangChain hub format, PromptML/POML or similar attempts at prompt
   markup standards — what actually got adoption).
3. **Workflow-ish artifacts.** What formats exist for multi-step AI
   workflows that ordinary users touch (Claude Code subagents/agent
   definitions, GitHub Actions AI workflows, n8n/Zapier AI steps,
   LangGraph configs)? Only as deep as needed to decide whether
   "workflow" should be a first-class asset kind at launch or deferred.
4. **Sync/management tooling that already exists.** Open-source tools that
   manage or convert these files (rulesync-style converters, dotfile
   managers for AI config, skill installers, MCP registries' install
   flows). What do they get right/wrong? Is there a de-facto
   interchange format emerging, or is `AGENTS.md` winning?
5. **Design recommendation.** Propose: (a) the minimal asset-kind set for
   launch and what metadata each kind needs to round-trip into the tools
   above without loss; (b) a canonical internal representation (file
   bundle + frontmatter?) that maps cleanly onto all targets; (c) the 5
   highest-value sync targets to support first, ranked by user population
   × pain.

Format: a reference table per tool/format (location, syntax, scoping,
limits, source link), then the design recommendation. Cite primary docs
over blog posts; flag anything changing rapidly or in beta.
