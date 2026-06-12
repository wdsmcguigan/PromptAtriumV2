# Context-Injection Formats & Conventions — Survey for PromptAtrium Asset Taxonomy

**Status:** Research groundwork · **Currency:** mid-2026 (researched June 2026) · **Audience:** PromptAtrium asset-taxonomy & adapter design

This survey maps every significant context-injection format used by AI coding/assistant tools, to ground PromptAtrium's asset taxonomy and per-tool adapters in reality. PromptAtrium syncs "AI working set" assets (prompts, system prompts, skills, rules, workflows) into the tools where people work, via an MCP server and a CLI.

Primary docs are cited over blog posts. Items in beta or churning are flagged. Where the cross-tool standard site and a tool's own docs disagree, both are noted.

> **Fast-moving warning.** This entire space moved from "one convention per tool" to "an emerging cross-tool standard plus a cottage industry of converters" between Dec 2025 and Q2 2026. Treat every "natively supports X" claim as a moving target; re-verify per-tool at adapter-build time. The most volatile facts: AGENTS.md native-support matrix, MCP spec revision, Windsurf→Devin rebrand paths, and Claude Code's AGENTS.md stance.

---

## Section 1 — Per-tool instruction / rules files

### 1.1 Claude Code (Anthropic)

| Location | Format | Scoping | Size limits | Precedence / merging | Source |
|---|---|---|---|---|---|
| Managed policy `CLAUDE.md` — macOS `/Library/Application Support/ClaudeCode/CLAUDE.md`; Linux/WSL `/etc/claude-code/CLAUDE.md`; Windows `C:\Program Files\ClaudeCode\CLAUDE.md` | Plain markdown | Org-wide (machine) | none (full-loaded) | Loads **first**; cannot be excluded by `claudeMdExcludes`; also inlinable via `claudeMd` in managed-settings.json | [memory](https://code.claude.com/docs/en/memory) |
| User `~/.claude/CLAUDE.md` | Plain markdown | Personal, all projects | <200 lines (soft) | After managed, before project | [memory](https://code.claude.com/docs/en/memory) |
| Project `./CLAUDE.md` or `./.claude/CLAUDE.md` | Plain markdown | Team, repo | <200 lines (soft); loaded in full | Concatenated; ancestor dirs ordered root→cwd (closer read last) | [memory](https://code.claude.com/docs/en/memory) |
| Local `./CLAUDE.local.md` | Plain markdown | Personal, this project (gitignore) | — | Appended **after** `CLAUDE.md` in same dir | [memory](https://code.claude.com/docs/en/memory) |
| Subdirectory `CLAUDE.md` | Plain markdown | Path-scoped | — | Not loaded at launch; loaded **on demand** when Claude reads files there | [memory](https://code.claude.com/docs/en/memory) |
| `.claude/rules/*.md` (recursive); `~/.claude/rules/` for user | Markdown; optional YAML frontmatter `paths:` (glob list) | Project / user | — | No-`paths` rules load at launch at same priority as `.claude/CLAUDE.md` | [memory](https://code.claude.com/docs/en/memory) |
| `@path/to/file` import inside CLAUDE.md | `@` syntax, relative/absolute | — | Max recursion **4 hops** | Expanded into context at launch | [memory](https://code.claude.com/docs/en/memory) |
| Slash commands `.claude/commands/*.md` (project), `~/.claude/commands/*.md` (user) | Markdown | Project / user | — | Invoked by name; **being merged into skills** | [.claude dir](https://code.claude.com/docs/en/claude-directory) |
| Hooks — `settings.json` (`.claude/settings.json`, `.local`, `~/.claude/`, managed) | JSON | user/project/local/managed | — | Managed > local > project > user; arrays merge | [settings](https://code.claude.com/docs/en/settings) |
| MCP config — `.mcp.json` (project, committed); user via `~/.claude.json` / `claude mcp add --scope user` | JSON | project vs user vs local | — | Project servers require approval; scopes layer | [settings](https://code.claude.com/docs/en/settings) · [mcp](https://code.claude.com/docs/en/mcp) |

**Load rule (verified):** all discovered files are **concatenated, not overridden**; ordered filesystem-root → cwd; `CLAUDE.local.md` appended after `CLAUDE.md`. **Claude Code does not read `AGENTS.md` natively** — it reads only `CLAUDE.md`. Recommended bridge: `@AGENTS.md` import inside CLAUDE.md, or a filesystem symlink. (Tracked: [anthropics/claude-code#31005](https://github.com/anthropics/claude-code/issues/31005).)

### 1.2 Cursor

| Location | Format | Scoping | Size | Precedence | Source |
|---|---|---|---|---|---|
| `.cursor/rules/*.mdc` (nestable, e.g. `.cursor/rules/frontend/components.mdc`) | **MDC** = markdown + YAML frontmatter `description`, `globs`, `alwaysApply` | Project; nested dirs scope to their folder | best-practice <500 lines | see rule types | [rules](https://cursor.com/docs/context/rules) |
| User Rules (Settings → Rules) | Plain text | Global to Cursor | — | Lowest | [rules](https://cursor.com/docs/context/rules) |
| Team Rules (Team/Enterprise dashboard) | Dashboard | Org-wide | — | **Highest** | [rules](https://cursor.com/docs/context/rules) |
| `AGENTS.md` (root + nested) | Plain markdown | Project | — | Honored natively; other plain `.md` ignored | [rules](https://cursor.com/docs/context/rules) |
| Legacy `.cursorrules` (root) | Plain markdown | Project | — | Supported but **deprecated** | [rules](https://cursor.com/docs/context/rules) |

**Four rule types** (frontmatter combos): **Always** (`alwaysApply: true`); **Auto Attached** (`globs` set → included when matching file referenced); **Agent Requested** (`description` set → agent decides); **Manual** (no description/globs → only when @-mentioned). **Precedence:** Team → Project → User. Rules affect Agent/Chat, not Tab/Cmd-K.

### 1.3 AGENTS.md (the cross-tool standard)

| Location | Format | Scoping | Size | Precedence | Source |
|---|---|---|---|---|---|
| `AGENTS.md` at repo root; extra files per subproject in monorepos | Standard Markdown, **no required fields** | Root + nested per subproject | none defined | **Nearest-file-wins**; explicit user chat prompt overrides everything | [agents.md](https://agents.md/) |

Claimed adoption: **"used by over 60k open-source projects."** Now stewarded by the **Agentic AI Foundation (Linux Foundation)** (origins: OpenAI Codex, Amp, Jules, Cursor, Factory). Tools the site lists as honoring it natively (mid-2026): **Codex, Jules, Factory, Aider\*, goose, opencode, Zed, Warp, VS Code, Devin, UiPath, Junie, Amp, Cursor, RooCode, Gemini CLI\*\*, Kilo Code, Phoenix, Semgrep, GitHub Copilot Coding Agent, Ona, Windsurf, Augment Code.**

- **\* Aider discrepancy:** agents.md lists Aider, but Aider's own docs document only `CONVENTIONS.md` and never mention AGENTS.md. Treat Aider AGENTS.md support as **unconfirmed by primary Aider docs**.
- **\*\* Gemini CLI:** honors AGENTS.md only when added to `context.fileName` — **not native by default**.
- **Notable holdout: Claude Code** (reads only CLAUDE.md).

### 1.4 GitHub Copilot

| Location | Format | Scoping | Size | Precedence | Source |
|---|---|---|---|---|---|
| `.github/copilot-instructions.md` | Plain markdown, always-on | Repo-wide | not documented | Applied to all chat; combined with AGENTS.md if both present | [GH](https://docs.github.com/en/copilot/concepts/response-customization) · [VS Code](https://code.visualstudio.com/docs/copilot/customization/custom-instructions) |
| `.github/instructions/**/*.instructions.md` | Markdown + YAML frontmatter `applyTo:` (glob) | Path-scoped | — | Auto-applied when files match glob | [ref](https://docs.github.com/en/copilot/reference/custom-instructions-support) |
| `AGENTS.md` (root/cwd, or dirs in `COPILOT_CUSTOM_INSTRUCTIONS_DIRS`) | Plain markdown | Repo / nested | — | If both AGENTS.md and copilot-instructions.md exist, **both used** | [ref](https://docs.github.com/en/copilot/reference/custom-instructions-support) |
| Personal instructions (github.com profile) | settings text | Per-user, all repos | — | Combined | [ref](https://docs.github.com/en/copilot/reference/custom-instructions-support) |
| Organization instructions (org settings) | settings | Org-wide | — | Combined | [ref](https://docs.github.com/en/copilot/reference/custom-instructions-support) |

**VS Code keys:** `github.copilot.chat.codeGeneration.useInstructionFiles`, `chat.instructionsFilesLocations` (default `.github/instructions`; user `~/.copilot/instructions`), `chat.useAgentsMdFile`, `chat.useNestedAgentsMdFiles` (**experimental**), `chat.useClaudeMdFile`.

### 1.5 Windsurf (Cascade) — now Devin/Cognition

| Location | Format | Scoping | Size | Precedence | Source |
|---|---|---|---|---|---|
| `.devin/rules/*.md` (preferred) | Markdown + YAML frontmatter `trigger:` | Workspace | **12,000 chars/file** | `.devin/` **takes precedence** over `.windsurf/` | [Devin docs](https://docs.devin.ai/desktop/cascade/memories) |
| `.windsurf/rules/*.md` (legacy fallback) | same | Workspace | 12,000 chars/file | Back-compat fallback | same |
| `.windsurfrules` (root single file) | Markdown | Workspace | (legacy) | Legacy single-file | same |
| `~/.codeium/windsurf/memories/global_rules.md` | Markdown, always-on | Global | **6,000 chars** | Always active | same |

**Activation (`trigger:`):** `always_on`, `model_decision`, `glob` (with `globs`), `manual` (`@rule-name`). Root/global `AGENTS.md` are frontmatter-less and always active. **Flag:** docs.windsurf.com now redirects to docs.devin.ai; `.devin/rules/` is the documented preferred path.

### 1.6 Cline & Roo Code

**Cline:**

| Location | Format | Scoping | Precedence | Source |
|---|---|---|---|---|
| `.clinerules` (file) **or** `.clinerules/` (dir of `.md`/`.txt`) | Markdown/txt; optional YAML `paths:` glob | Workspace | All files in dir combined; numeric prefixes order | [cline rules](https://docs.cline.bot/features/cline-rules) |
| Global `~/Documents/Cline/Rules` (Linux fallback `~/Cline/Rules`) | Markdown/txt | Global | Workspace **takes precedence** on conflict; both combined | [cline rules](https://docs.cline.bot/features/cline-rules) |
| Rules Bank `clinerules-bank/` | Markdown | Inactive library | Not auto-loaded; copy into `.clinerules/` to activate | [overview](https://docs.cline.bot/features/cline-rules/overview) |
| Also auto-detects `.cursorrules`, `.windsurfrules`, `AGENTS.md` (or `~/.agents/AGENTS.md`) | — | — | Cross-tool compat | [cline rules](https://docs.cline.bot/features/cline-rules) |

**Roo Code:**

| Location | Format | Scoping | Precedence | Source |
|---|---|---|---|---|
| `.roo/rules/` (recursive) | Markdown | Workspace | Loaded **alphabetically**; dir method beats single-file | [roo](https://roocodeinc.github.io/Roo-Code/features/custom-instructions) |
| `.roo/rules-{modeSlug}/` | Markdown | Mode-specific | Mode rules load before general | same |
| Global `~/.roo/rules/`, `~/.roo/rules-{modeSlug}/` | Markdown | Global | Global first; **project takes precedence** on conflict | same |
| Legacy `.roorules`, `.roorules-{modeSlug}`, `.clinerules-{mode-slug}` | Markdown | Workspace | Ignored if corresponding dir exists | same |
| `AGENTS.md` (root) | Markdown | Workspace | Auto-loaded unless `roo-cline.useAgentRules: false` | same |

### 1.7 Aider

| Location | Format | Scoping | Precedence | Source |
|---|---|---|---|---|
| `CONVENTIONS.md` (via `/read`, `aider --read`, or `read:` in config) | Plain markdown | Whatever you point at | Loaded **read-only** (cacheable) | [conventions](https://aider.chat/docs/usage/conventions.html) |
| `.aider.conf.yml` (home → git root → cwd) | YAML | Three-level hierarchy | **Last-loaded wins** (cwd > git-root > home) | [config](https://aider.chat/docs/config/aider_conf.html) |

**AGENTS.md:** not in Aider's primary docs; CONVENTIONS.md is the documented mechanism. Native AGENTS.md support **unconfirmed**.

### 1.8 JetBrains AI Assistant / Junie

| Location | Format | Scoping | Precedence | Source |
|---|---|---|---|---|
| `.junie/AGENTS.md` (preferred) | Plain markdown | Project | Discovery order **1** | [junie guidelines](https://junie.jetbrains.com/docs/guidelines-and-memory.html) |
| `AGENTS.md` (root) | Plain markdown | Project | Discovery order **2** | same |
| `.junie/guidelines.md` or `.junie/guidelines/` (legacy) | Markdown | Project | Discovery order **3** | same |
| Global `~/.junie/AGENTS.md` | Markdown | User | **Project takes precedence**; identical content dedup'd | same |
| `.aiignore` (root) | Ignore patterns | Project | Restricts processable files | [AI Assistant](https://www.jetbrains.com/help/ai-assistant/junie-agent.html) |

### 1.9 Codex CLI (OpenAI)

| Location | Format | Scoping | Size | Precedence | Source |
|---|---|---|---|---|---|
| Global `~/.codex/AGENTS.override.md` then `~/.codex/AGENTS.md` (`CODEX_HOME` overrides) | Markdown | User | `project_doc_max_bytes` default **32 KiB**, total budget | Only first non-empty per level; placed **first** = lowest effective precedence | [agents-md guide](https://developers.openai.com/codex/guides/agents-md) |
| Project: each dir root→cwd: `AGENTS.override.md` → `AGENTS.md` → `project_doc_fallback_filenames` | Markdown | Repo + nested | shared 32 KiB budget | At most one file per dir; concatenated root→cwd; **closer-to-cwd wins** (recency) | [agents-md guide](https://developers.openai.com/codex/guides/agents-md) |
| `~/.codex/config.toml` (+ project `.codex/config.toml`, trusted) | TOML | User + project | — | Profile files `~/.codex/<name>.config.toml` overlay (old `[profiles.x]` table removed in 0.134.0) | [config-reference](https://developers.openai.com/codex/config-reference) · [advanced](https://developers.openai.com/codex/config-advanced) |

Key knobs: `project_doc_max_bytes` (default 32768; `0` disables AGENTS.md loading entirely — implemented as a **cumulative** budget, source-authoritative), `project_doc_fallback_filenames`, `[features].child_agents_md`. Legacy `codex.md` is **gone** from current source/docs (no built-in alias; revive via fallback filenames).

### 1.10 Gemini CLI (Google)

| Location | Format | Scoping | Precedence / merging | Source |
|---|---|---|---|---|
| Global `~/.gemini/GEMINI.md` | Markdown | User | Loaded first (broadest); **concatenated** | [gemini-md](https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/gemini-md.md) |
| Project root `./GEMINI.md` + ancestors (up to `.git`/home) | Markdown | Repo | Concatenated; sent with **every prompt** | same |
| Subdirectory `./src/GEMINI.md` (JIT) | Markdown | Path-scoped | Just-in-time scan of accessed dir + ancestors; bounded by `context.memoryBoundaryMarkers` (default `[".git"]`) | [tutorial](https://geminicli.com/docs/cli/tutorials/memory-management/) |
| `.gemini/settings.json` — `context.fileName` (string\|array; legacy alias `contextFileName`) | JSON | system/user/project | defaults → system-defaults → user → project → system-settings → env → CLI args | [config](https://geminicli.com/docs/reference/configuration/) |
| `AGENTS.md` via `context.fileName: ["AGENTS.md", ...]` | — | — | Config-only, **not native default** | [gemini-md](https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/gemini-md.md) |

`@./path.md` / `@../path.md` imports (relative + absolute). `/memory` subcommands: `show`, `refresh`, `list`. No documented size limit. No `settings.json` key controls the lookup beyond `context.fileName`.

### 1.11 Zed

| Location | Format | Scoping | Precedence | Source |
|---|---|---|---|---|
| Project root: first match of `.rules`, `.cursorrules`, `.windsurfrules`, `.clinerules`, `.github/copilot-instructions.md`, `AGENT.md`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md` | Plain markdown/text | Project (worktree root; subdir support **not documented**) | **First match wins — only ONE file loaded, no merge** | [instructions](https://zed.dev/docs/ai/instructions) |
| Personal global `~/.config/zed/AGENTS.md` (Win `%APPDATA%\Zed\AGENTS.md`) | Markdown | All projects | Applies everywhere; **project overrides on conflict** | [instructions](https://zed.dev/docs/ai/instructions) |
| Skills (reusable, successor to Rules Library): global `~/.agents/skills/`, project `<worktree>/.agents/skills/` | `SKILL.md` + YAML frontmatter (`name`, `description` req) | Global + project | Project-local overrides same-named global | [skills](https://zed.dev/docs/ai/skills) |

**Major change:** Zed v1.4.0 **replaced the on-demand Rules Library with Skills** (reusable) + Instructions (always-on); default rules were migrated into the global `AGENTS.md`. The legacy `/docs/ai/rules` page is now a migration note.

### Section 1 cross-cutting takeaways

- **Format convergence:** plain Markdown for instructions; YAML frontmatter for anything scoped/triggered (Cursor `.mdc`, Copilot `.instructions.md`, Windsurf `trigger:`, Claude `.claude/rules` `paths:`, skills).
- **Scoping is universally 3-tier:** global/user → project/repo → subdirectory (nearest-wins or concatenate-root-down).
- **Two merge philosophies:** **concatenate** (Claude Code, Gemini CLI, Codex, Copilot) vs **first-match-wins** (Zed) vs **layered-override** (Cursor Team>Project>User).
- **Hard size limits are rare** — only Windsurf (6k/12k chars) and Codex (32 KiB budget) document them. Everything else is soft guidance (<200 lines Claude, <500 lines Cursor).
- **AGENTS.md is the de-facto root format**, honored natively by nearly everyone except Claude Code and (effectively) Aider.

---

## Section 2 — Packaged / bundled formats

### 2.1 Agent Skills (open SKILL.md standard) & Claude Code Skills

A skill is a **directory** with an entrypoint `SKILL.md` (YAML frontmatter + Markdown body) and optional `scripts/`, `references/`, `assets/`. Progressive disclosure: ~100-token metadata at startup → full body on activation → resource files on reference.

```
my-skill/
├── SKILL.md          # required: frontmatter + instructions
├── reference.md      # optional, loaded on demand
├── examples/
└── scripts/
```

| Spec | Frontmatter | Limits | Adoption | Source |
|---|---|---|---|---|
| **Agent Skills (open)** — published 2025-12-18, maintained at agentskills.io | `name` (req), `description` (req), `license`, `compatibility`, `metadata`, `allowed-tools` (experimental) | name ≤64; description ≤1024; compatibility ≤500; body <~5000 tokens rec.; <500 lines | High & fast — reported adopted by VS Code, ChatGPT/Codex, Gemini CLI, Junie, AWS Kiro, goose | [spec](https://agentskills.io/specification) · [Anthropic](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills) |
| **Claude Code Skills** — superset | adds `disable-model-invocation`, `user-invocable`, `context: fork`, `agent`, `model`, `effort`, `hooks`, `paths`, `when_to_use`, `argument-hint`, `allowed-tools`, `disallowed-tools` | desc+when_to_use truncated at **1,536 chars** in listing (`maxSkillDescriptionChars`); listing budget ~1% context | Native default toolkit | [skills](https://code.claude.com/docs/en/skills) |

**Where skills live (Claude Code):** Enterprise > Personal `~/.claude/skills/<name>/SKILL.md` > Project `.claude/skills/<name>/SKILL.md`; Plugin `<plugin>/skills/<name>/SKILL.md` (namespaced `plugin:skill`). **Command name = directory name** (not frontmatter `name`). Note Claude Code uses `allowed-tools` (hyphen) and it **grants pre-approval**, not restriction. Claude Code's extra fields are **Claude-Code-only** and won't port to other Agent Skills runtimes.

### 2.2 MCP prompts & resources (protocol-level)

**Spec revision:** current released **2025-11-25** (prompts/resources shapes unchanged from 2025-06-18; 2025-11-25 added icons; a **2026-07-28 release candidate** exists — stateless core, Extensions, Tasks, MCP Apps — not yet released as of June 2026). Date-string versioning.

**Prompts** (capability `prompts: { listChanged }`):
- `prompts/list` → `{ prompts: [{ name, title?, description?, arguments?: [{ name, description?, required? }] }], nextCursor? }`
- `prompts/get` (`{ name, arguments }`) → `{ description?, messages: PromptMessage[] }`
- **PromptMessage** = `{ role: "user"|"assistant", content }`, content ∈ Text `{type:"text", text}` / Image `{type:"image", data, mimeType}` / Audio `{type:"audio",...}` / Embedded Resource `{type:"resource", resource:{uri, mimeType, text|blob}}`.

**Resources** (capability `resources: { subscribe, listChanged }`):
- `resources/list` → Resource `{ uri, name, title?, description?, mimeType?, size? }` (paginated)
- `resources/read` (`{uri}`) → `{ contents: [{uri, mimeType, text} | {uri, mimeType, blob}] }` (text **xor** blob)
- `resources/templates/list` → `{ uriTemplate (RFC 6570), name, title?, description?, mimeType? }`
- Annotations: `audience`, `priority` (0.0–1.0), `lastModified` (ISO 8601). Schemes: `https`, `file`, `git`, custom.

Source: [prompts](https://modelcontextprotocol.io/specification/2025-06-18/server/prompts) · [resources](https://modelcontextprotocol.io/specification/2025-06-18/server/resources). MCP is now governed by the **Agentic AI Foundation (Linux Foundation)** after Anthropic's Dec 2025 donation.

### 2.3 Hosted assistant instruction fields & limits

| Product | Field | Documented limit | Source |
|---|---|---|---|
| Claude Projects | custom instructions + knowledge | **Not documented** (community guesses ~8k chars — treat as unverified); KB ~200k tokens, ~10× with auto-RAG | [projects](https://support.claude.com/en/articles/9517075-what-are-projects) |
| OpenAI custom GPTs | Instructions textarea | **8,000 chars** (builder-UI constraint, not a formal API spec) | [community](https://community.openai.com/t/why-is-the-my-gpt-instructions-limited-by-8000-characters/1006936) |
| Gemini Gems | Instructions + knowledge | **No documented hard limit** (third-party 500–2000 char *quality* guidance only) | [gems](https://support.google.com/gemini/answer/15235603) |
| OpenAI Assistants API v2 | `instructions` string | **256,000 chars** (Help Center FAQ) — **API sunsetting**, migrate to Responses | [faq](https://help.openai.com/en/articles/8550641-assistants-api-v2-faq) |
| OpenAI Responses API | `instructions` param | **No explicit char limit** (context-window bound); not carried across `previous_response_id` | [reference](https://developers.openai.com/api/reference/resources/responses/methods/create) |

### 2.4 Agent-framework templates / markup standards (honest adoption)

| Format | What it is | Adoption | Source |
|---|---|---|---|
| LangChain/LangSmith Hub | hosted prompt registry, `hub.push/pull`, commit-hash versioning; stores `ChatPromptTemplate`/`PromptTemplate` JSON | Solid **inside LangChain**, niche outside | [hub](https://blog.langchain.com/langchain-prompt-hub/) · [manage prompts](https://docs.langchain.com/langsmith/manage-prompts-programmatically) |
| `ChatPromptTemplate` | in-code message-list template (f-string/Jinja2) | Very high — core LangChain primitive | [ref](https://reference.langchain.com/python/langchain-core/prompts/chat/ChatPromptTemplate) |
| **Microsoft Prompty** (`.prompty`) | Markdown+YAML single-prompt asset; frontmatter `name/description/model/inputs/outputs/sample/tools/template`; body `system:`/`user:` + `{{var}}` | **Moderate / MS-centric** (Azure AI, Prompt flow, Semantic Kernel, VS Code) — most traction of the markup formats | [prompty](https://github.com/microsoft/prompty) |
| **Microsoft POML** | HTML-like prompt-orchestration markup (`<role><task><example>…`); VS Code ext + SDKs | **Niche/early** (research project, Aug 2025, arXiv:2508.13948) | [poml](https://github.com/microsoft/poml) |
| "PromptML" | several unrelated XML/YAML projects | **Low/fragmented** — no convergence | [example](https://github.com/narenaryan/promptml) |
| Jinja2/Mustache | generic templating reused for prompts | **Ubiquitous as engine**, not itself a standard | — |

**Genuinely cross-vendor winners are MCP** (server-side prompts/resources) and **Agent Skills** (packaged instructions). The markup standards mostly did **not** achieve broad cross-vendor adoption; Prompty is the strongest but Microsoft-ecosystem-bound.

---

## Section 3 — Workflow-ish artifacts

| Format | Location / shape | Portable plain-file? | Source |
|---|---|---|---|
| Claude Code subagent | `.claude/agents/*.md` (project) / `~/.claude/agents/*.md` (user); Markdown + YAML frontmatter (`name`, `description`, `tools`, `model`, `permissionMode`, `skills`, `memory`, `hooks`…) | **Yes** — self-contained text file | [sub-agents](https://code.claude.com/docs/en/sub-agents) |
| Claude Code plugin | dir w/ `.claude-plugin/plugin.json` + `skills/ agents/ commands/ hooks/ .mcp.json` | **Yes** — versioned dir / `.zip` | [plugins](https://code.claude.com/docs/en/plugins) |
| GitHub Agentic Workflow (`gh-aw`) **[preview]** | `.github/workflows/*.md` (source) → `*.lock.yml` (compiled) | **Partial** — `.md` portable, needs `gh aw compile`, output GH-Actions-locked | [gh-aw](https://github.github.com/gh-aw/) · [githubnext](https://githubnext.com/projects/agentic-workflows/) |
| Claude Code GitHub Action | `.github/workflows/*.yml` w/ `uses:` step | File-portable, GH-Actions-locked semantics | [github/gh-aw](https://github.com/github/gh-aw) |
| n8n workflow | JSON export | **In-tool only** — proprietary schema, version-fragile, strips creds | [n8n](https://docs.n8n.io/workflows/export-import/) |
| Zapier Zap/Agent | account-to-account import/export (Team/Enterprise) | **No** open portable format | [zapier](https://help.zapier.com/hc/en-us/articles/8496308481933) |
| LangGraph | code (`StateGraph`/`@entrypoint`) + `langgraph.json` deploy manifest | **No** — workflow is code; `langgraph.json` only references it | [cli](https://docs.langchain.com/langsmith/cli) |

**Recommendation: defer a generic "workflow" asset kind at launch.** The things users call "workflows" have no common portable schema — n8n is proprietary/version-fragile, Zapier has no open export, LangGraph is code, and `gh-aw` (the only true workflow-as-portable-markdown candidate) is explicitly **preview** and emits GitHub-Actions-locked artifacts. A single "workflow" kind would span formats with nothing in common. **However, ship Claude Code subagents (`.claude/agents/*.md`) as a first-class kind now** — it's a clean self-contained Markdown+YAML file with the same project/user scoping as everything else. Revisit a dedicated "workflow" kind once `gh-aw` stabilizes out of preview.

---

## Section 4 — Sync / management tooling that already exists

### 4.1 Rules/instruction converters

| Tool | Targets / formats | Strengths | Weaknesses | Source |
|---|---|---|---|---|
| **rulesync** (dyoshikawa) | 25+ agents; rules, ignore, MCP, commands, subagents, skills, hooks | Broadest surface; import/generate/`convert`; very active (v8.x) | `.rulesync/` is another source-of-truth; per-tool parity varies | [repo](https://github.com/dyoshikawa/rulesync) |
| **ruler** (intellectronica) | 30+ agents | Central `.ruler/`+`ruler.toml`; source-traceability comments; **MCP propagation**; most popular (~2.7k★) | Self-labeled **Beta Research Preview**; one-way; bespoke MCP-TOML dialect | [repo](https://github.com/intellectronica/ruler) |
| **ai-rulez** (Goldziher) | 19+ platforms | Go binary; 33 builtin rule "domains"; **own MCP server** (agent can self-govern); profiles/remote includes | Smaller (~119★); opinionated; bespoke dialect | [repo](https://github.com/Goldziher/ai-rulez) |
| **ai-rules** (Block) | 11 agents | Rust; Block-backed; **`status` drift detection** (rare differentiator) | Small (~106★); fewer targets | [repo](https://github.com/block/ai-rules) |
| **vibe-rules** (FutureExcited) | cursor/windsurf/claude/gemini/codex/cline/roo/vscode | Personal reusable rule library; tagged blocks w/ `alwaysApply`/`globs` | More personal than team; tag-injection fragile | [repo](https://github.com/FutureExcited/vibe-rules) |
| **rule-porter** (nedcodes) | Cursor/Windsurf/CLAUDE/AGENTS/Copilot — **bidirectional** | Zero-dep, single-purpose migration | Conversion only, no ongoing sync | [repo](https://github.com/nedcodes-ok/rule-porter) |
| **airul** (mitkury) | generates one context file from linked docs | docs-as-input assembly | Narrow; not multi-target sync | [repo](https://github.com/mitkury/airul) |

> Naming traps: "ai-context-convert" and standalone "airules" don't exist as real maintained projects; `airul`, `ai-rulez`, and `ai-rules` (Block) are three different tools.

### 4.2 Skill / command / subagent installers & marketplaces

| Tool | Targets | Notes | Source |
|---|---|---|---|
| Claude plugin/marketplace (official) | Claude Code only | `marketplace.json` + `plugin.json`; GitHub/git/npm sources; version pinning (ref+sha); managed-settings governance; cache at `~/.claude/plugins/cache/...` | [marketplaces](https://code.claude.com/docs/en/plugin-marketplaces) · [discover](https://code.claude.com/docs/en/discover-plugins) |
| anthropics/claude-plugins-official | Claude Code | ~29.9k★; auto-available; `/plugins` + `/external_plugins`; companion `claude-plugins-community` (auto-screened) | [repo](https://github.com/anthropics/claude-plugins-official) |
| awesome-claude-code | all | ~46.2k★; CSV-backed discovery index (not installer) | [repo](https://github.com/hesreallyhim/awesome-claude-code) |
| **`npx skills`** (Vercel Labs) | **70+ agents** | GitHub-as-registry; SKILL.md; symlink-by-default; lockfiles; ~22.1k★, v1.5.x; strongest cross-agent skill installer | [repo](https://github.com/vercel-labs/skills) |
| **OpenPackage** (enulus) | **40+ platforms** | `openpackage.yml`; installs **rules+commands+agents+skills+MCP** w/ cross-platform conversion; **early (v0.11.x, ~576★)** | [repo](https://github.com/enulus/OpenPackage) |
| dot-agents | Cursor/Claude/Codex/OpenCode | Single `~/.agents/` dir, git-syncable, `doctor` restores symlinks; cleanest "AI config as dotfiles"; early-mid v1 | [site](https://www.dot-agents.com/) |
| agentdots | 9+ agents | `~/.agentdots/`; **"not usable yet" (0★)** | [repo](https://github.com/PMelch/agentdots) |

### 4.3 MCP registries & install flows

| Registry | What | Install mechanism | Source |
|---|---|---|---|
| **Official MCP Registry** | foundation-governed **metadata** catalog (~2k curated, namespace-authenticated); `server.json` + OpenAPI | **None by design** — points at npm/PyPI/Docker; expects downstream aggregators to install | [about](https://modelcontextprotocol.io/registry/about) · [repo](https://github.com/modelcontextprotocol/registry) |
| **Smithery** | ~7.3k installable servers | CLI **writes into client config** (`--client claude\|cursor`); also remote Streamable-HTTP hosting | [cli](https://smithery.ai/docs/concepts/cli) |
| **Docker MCP Catalog/Toolkit** | 300+ signed container servers | **Gateway model** — one gateway entry per client; central secrets/OAuth | [docs](https://docs.docker.com/ai/mcp-catalog-and-toolkit/) |
| mcp.run | Wasm "servlets" | account/profile-centric; per-servlet network+FS capability grants | [docs](https://docs.mcp.run/) |
| PulseMCP | ~17.9k crawled (largest fresh index) | catalog only — surfaces upstream install command | [servers](https://www.pulsemcp.com/servers) |
| Glama | ~34.5k indexed | build-and-host-from-repo; auto-wraps stdio→Streamable HTTP | [hosting](https://glama.ai/mcp/hosting) |
| Universal installers (`install-mcp` 19 clients, `add-mcp`, `mcpx`) | write same server config into many clients at once | the "missing middle" for config sprawl; sub-1k★, fast-moving | [install-mcp](https://github.com/supermemoryai/install-mcp) · [add-mcp](https://github.com/neondatabase/add-mcp) |

### 4.4 Key questions answered

**Is an interchange format emerging?** Yes, two layers: (1) the human-facing **root file = AGENTS.md** (plain Markdown), the lowest-common-denominator target everyone converts toward; (2) a **"single source of truth → generate native outputs"** pattern that rulesync/ruler/ai-rulez/ai-rules/vibe-rules all independently converged on. But **no single structured intermediate schema has won** — every generator invented its own source dialect (TOML, MD+YAML, tagged XML). The only structured cross-vendor schema is on the **MCP side (`server.json`)**, not rules.

**Is AGENTS.md "winning"?** **Yes — with one asterisk: Claude Code.** Governance is strong (OpenAI origin Aug 2025 → Linux Foundation AAIF by Dec 2025; **60k+ repos**, 170+ member orgs). **Native auto-discovery:** Cursor, Windsurf, Cline, Roo, Codex, Copilot, Zed, Junie, Amp, Factory, opencode, Warp, etc. **Config-only:** Gemini CLI (`context.fileName`). **NOT native: Claude Code** — reads only CLAUDE.md; if a repo ships only AGENTS.md, Claude Code loads **zero** project instructions. Workarounds: `@AGENTS.md` import in CLAUDE.md, or a symlink. ([anthropics/claude-code#31005](https://github.com/anthropics/claude-code/issues/31005).)

**The white-space gap for a new tool:** the landscape splits into two non-overlapping silos — **rules sync** (rulesync/ruler/…, but source-format-fragmented and mostly one-way) and **MCP install** (Smithery/Docker/registry, but rules-blind). The unoccupied intersection is **one OSS library, exposed as both an MCP server and a CLI, that (a) unifies rules sync + MCP config injection, (b) does bidirectional drift detection, (c) consumes the official `server.json` registry to inject client config, and (d) correctly handles Claude Code's non-native AGENTS.md gap.** That is precisely PromptAtrium's opening.

---

## Section 5 — Design recommendation

### 5(a) Minimal asset-kind set for launch + round-trip metadata

Launch with **five asset kinds**. Each is a Markdown body + frontmatter; the frontmatter superset below is what's needed to round-trip into the targets **without loss**.

| Kind | Maps to | Why first-class | Round-trip metadata it must carry |
|---|---|---|---|
| **`rule`** (instruction) | CLAUDE.md, AGENTS.md, `.cursor/rules/*.mdc`, `.github/copilot-instructions.md` + `.instructions.md`, `.windsurf`/`.devin` rules, `.clinerules`, `.roo/rules`, GEMINI.md, Zed `.rules` | The universal, highest-volume asset; every tool has one | `scope` (global/project/subdir), `activation` (always / auto-attached / agent-requested / manual / glob), `globs[]` (→ Cursor `globs`, Copilot `applyTo`, Windsurf glob trigger, Claude `paths`), `description` (→ agent-requested + Copilot/Cursor desc), `apply_to_path` for path-scoping, `targets` include/exclude |
| **`skill`** | Agent Skills `SKILL.md` bundle (Claude Code, VS Code, Codex, Gemini CLI, Junie, Zed, goose) | Emerging cross-tool open standard; bundles resources | `name` (≤64), `description` (≤1024), `license`, `compatibility`, `allowed-tools[]`, bundled resource file list; keep Claude-Code-only fields (`when_to_use`, `context`, `model`, `effort`, `hooks`) in a namespaced `x-claude` block so they survive without polluting the portable core |
| **`command`** | `.claude/commands/*.md`, Cursor/others slash commands | Distinct UX from rules; still separate in most tools (note: Claude Code is folding commands into skills) | `name`, `description`, `argument-hint`, `arguments`, body template with `$ARGUMENTS` |
| **`prompt`** | MCP `prompts/get` PromptMessage[], LangChain Hub, standalone templates, hosted-assistant instruction fields | The "prompt/system-prompt" core of the working set; serves the MCP-server surface directly | `name`, `title`, `description`, `arguments[] {name, description, required}`, `role` per message, `messages[]` (text/image/audio/resource), char-limit hints for hosted targets (GPT 8k, Assistants 256k) |
| **`mcp-server`** | `.mcp.json`, `claude_desktop_config.json`, `.vscode/mcp.json`, Cursor/Windsurf MCP config; official `server.json` | The other half of the "working set"; the rules-sync tools ignore it — this is the differentiator | `server.json`-compatible: reverse-DNS `name`, package pointer (npm/PyPI/Docker/remote URL), `args`, `env` (with secret refs, never values), transport (stdio/Streamable HTTP), per-client scope (project/user/local) |

**Defer:** `workflow` (no portable cross-tool schema; revisit when `gh-aw` exits preview). **Treat `agent`/subagent** as an optional sixth kind if launch scope allows — it's clean (`.claude/agents/*.md`) but currently Claude-Code-mostly, so lower priority than the five above.

### 5(b) Canonical internal representation

A **file bundle per asset** — a directory whose entrypoint is a frontmatter'd Markdown file, mirroring the SKILL.md pattern so skills are zero-conversion and everything else reuses the same machinery:

```
<asset-slug>/
├── asset.md            # YAML frontmatter (superset) + Markdown body
├── <resources…>        # optional: scripts/, references/, assets/ (skills/commands)
└── (no separate manifest needed for single-file kinds)
```

**Canonical frontmatter superset** (one schema, supersets all targets; adapters project down and drop what a target can't represent):

```yaml
kind: rule | skill | command | prompt | mcp-server
name: string
description: string            # drives agent-requested activation + Cursor/Copilot desc
scope: global | project | subdir
activation: always | auto-attached | agent-requested | manual | glob   # rules
globs: ["src/**/*.ts"]         # → Cursor globs / Copilot applyTo / Windsurf / Claude paths
targets:                       # adapter routing
  include: [claude-code, cursor, copilot, codex, ...]
  exclude: []
allowed-tools: [...]           # skills/commands
arguments: [{name, description, required}]   # prompts/commands
x-claude: { when_to_use, context, model, effort, hooks }   # namespaced tool-specific escape hatch
x-cursor: { alwaysApply, ruleType }
x-mcp: { transport, package, env_refs }
```

**Design principles that make it round-trip without loss:**
1. **AGENTS.md as the lossless canonical for `rule`.** Store the rule body as plain Markdown so it emits to AGENTS.md verbatim; derive every other format (Cursor `.mdc` frontmatter, Copilot `applyTo`, Windsurf `trigger:`) from the canonical frontmatter. This bets on the actual winning standard.
2. **Namespaced `x-<tool>` escape hatches** preserve tool-specific fields (Claude `context: fork`, Cursor `alwaysApply`) so a Claude→canonical→Claude round-trip is byte-faithful, while a Claude→Cursor projection cleanly drops the inapplicable bits — explicit, not silent.
3. **Solve the Claude Code AGENTS.md gap explicitly:** the Claude adapter writes a thin `CLAUDE.md` containing `@AGENTS.md` (or manages a symlink, configurable). This is the single highest-value correctness behavior, since it's the one gap every existing tool gets wrong or ignores.
4. **Secrets never serialized** — `mcp-server` env carries references, not values; re-auth per machine (mirrors how Smithery/registry handle it).
5. **Drift detection over one-shot generation** — store a content hash per emitted target file so `status` can report when a tool's native file diverged from canonical (the feature only Block's `ai-rules` has today).

### 5(c) Top 5 sync targets to support first (ranked by population × pain)

1. **Claude Code** — large, fast-growing population **× highest pain**: it's where skills/commands/subagents/MCP all converge, AND it's the lone AGENTS.md holdout, so correct CLAUDE.md↔AGENTS.md bridging is uniquely valuable. The flagship adapter.
2. **Cursor** — the largest dedicated AI-IDE population; the `.mdc` frontmatter + four-rule-type + nested-dir model is genuinely fiddly (high pain) and a prime conversion target.
3. **GitHub Copilot** — the **largest raw developer population** of any target; `.github/copilot-instructions.md` + path-scoped `.instructions.md` + AGENTS.md combination benefits directly from generation.
4. **Codex CLI** — growing fast, AGENTS.md-**native** (low per-target pain), but high reach; cheap to support and validates the AGENTS.md-canonical bet. Supporting it also effectively covers the **AGENTS.md-native cohort** (Zed, Junie, Roo, opencode, Warp) with one canonical emit.
5. **Windsurf (Devin) / Gemini CLI** — pick by pain. **Windsurf** has real hard character limits (6k/12k) and rebrand churn (`.devin/` vs `.windsurf/`) = high pain and a place a sync tool adds clear value; **Gemini CLI** is simpler but needs the `context.fileName` config nudge to honor AGENTS.md. Recommend **Windsurf** for the #5 slot on pain, with Gemini CLI as the immediate next.

**Efficiency note:** because targets 3–5 (and Zed/Junie/Roo) honor AGENTS.md natively, an AGENTS.md-canonical core means one good emitter covers most of them; the per-adapter work concentrates on the two outliers that need bespoke handling — **Claude Code** (non-native AGENTS.md) and **Cursor** (`.mdc` translation). That is exactly where to spend engineering effort first.

---

## Appendix — items flagged as beta / rapidly changing

- **MCP spec** — released 2025-11-25; **2026-07-28 release candidate** (stateless core, Extensions, Tasks, MCP Apps) pending. Prompts/resources stable; auth/lifecycle/metadata churning.
- **Agent Skills** — open spec only formalized 2025-12-18; `allowed-tools` experimental; Claude-Code extra fields non-portable.
- **AGENTS.md native-support matrix** — grows monthly; re-verify per tool. Claude Code holdout tracked at [#31005](https://github.com/anthropics/claude-code/issues/31005).
- **Windsurf → Devin/Cognition** rebrand — docs redirect to docs.devin.ai; `.devin/rules/` now preferred over `.windsurf/`.
- **GitHub Copilot** `chat.useNestedAgentsMdFiles` — experimental.
- **Codex** profiles — `[profiles.x]` table removed in 0.134.0; now file-based `<name>.config.toml`.
- **Official MCP Registry** — still **preview**, no v1 GA; breaking changes/data resets possible.
- **`gh-aw` agentic workflows** — explicit early-development preview.
- **OpenAI Assistants API** — sunsetting toward Responses API.
- **Sync tools** (ruler "Beta Research Preview"; OpenPackage v0.11.x; agentdots "not usable yet"; universal MCP installers sub-1k★) — single-maintainer, fast-moving.
- **Undocumented limits** — Claude Projects and Gemini Gems instruction-length caps are community estimates, not official.
- **Aider AGENTS.md** — listed by agents.md but unconfirmed by Aider's own docs.
