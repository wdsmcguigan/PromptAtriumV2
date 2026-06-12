# **The Architecture of Context Permaculture: A Comprehensive Survey of AI Working Set Formats**

The rapid evolution of artificial intelligence in software engineering has shifted the bottleneck of productivity from code generation to context management. As large language models (LLMs) operate as autonomous agents within development environments, the methods by which developers inject context—rules, system prompts, skills, and workflows—have proliferated into a highly fragmented ecosystem. This document establishes the technical groundwork for designing the asset taxonomy and adapter architecture of a centralized context library. By mapping the invariants of context injection against the variants of proprietary tool formats, this analysis provides an exhaustive evaluation of per-tool instruction files, packaged skill formats, workflow artifacts, and synchronization tooling as of mid-2026.

## **1\. Per-Tool Instruction and Rules Files**

The foundational mechanism for guiding AI coding assistants relies on local, repository-bound instruction files. These files dictate coding standards, architectural boundaries, and operational heuristics. The ecosystem currently suffers from significant dialectical fragmentation regarding file location, format syntax, activation scoping, and precedence logic. The following subsections analyze every significant context-injection format.

### **Claude Code**

Claude Code employs a highly structured, hierarchical configuration system separating universal knowledge from dynamic capabilities and operational hooks.

| Feature | Specification |
| :---- | :---- |
| **Exact File Locations** | CLAUDE.md (project root), .claude/CLAUDE.md, ./CLAUDE.local.md, \~/.claude/CLAUDE.md, /etc/claude-code/CLAUDE.md1. Hooks reside in .claude/settings.json2. |
| **Format & Syntax** | Plain Markdown for rules, utilizing structural headers. JSON for settings and lifecycle hooks1. |
| **Scoping & Activation** | Policy (Admin) ![][image1] User (Global) ![][image1] Project (Repo) ![][image1] Local (Current Project). Files load immediately upon session initialization1. |
| **Size Limits** | Target under 200 lines per CLAUDE.md file. Auto-memory is capped at 25KB or the first 200 lines1. |
| **Precedence / Merging** | Managed/Policy settings load first and supersede local conflicts. Arrays of context are concatenated1. |
| **Source Link** | \[cite: 1, 2\] |

**Architectural Implications:** Claude Code distinguishes eager-loaded context (CLAUDE.md) from lazy-loaded capabilities. The architectural limitation of a 200-line optimal threshold forces developers to rely heavily on path-scoped rules or subagents to prevent context degradation1. Furthermore, Claude's hook system (PreToolUse, PostToolUse) introduces imperative security gates, blocking dangerous shell executions before the LLM can commit them, communicating state back to the agent via standard exit codes3. A centralized asset library managing Claude Code must sync both static markdown assets and JSON-based execution hooks to maintain complete environmental fidelity.

### **Cursor**

Cursor relies on highly granular, file-specific rules configured through a proprietary Markdown variant known as Markdown Cursor (.mdc).

| Feature | Specification |
| :---- | :---- |
| **Exact File Locations** | .cursor/rules/\*.mdc, legacy .cursorrules (root)6. |
| **Format & Syntax** | Markdown content prefixed with strict YAML frontmatter requiring description, globs, and alwaysApply8. |
| **Scoping & Activation** | Activated probabilistically via natural language descriptions, unconditionally via alwaysApply: true, or path-scoped via globs (e.g., \*\*/\*.ts)7. |
| **Size Limits** | Recommended under 500 lines per rule file7. |
| **Precedence / Merging** | .mdc files silently override legacy .cursorrules conflicts6. alwaysApply: true overrides glob restrictions in agent mode6. |
| **Source Link** | \[cite: 6, 7, 9, 10\] |

**Architectural Implications:** Cursor's implementation reveals a deep reliance on metadata over pure semantic search. The YAML frontmatter acts as a critical activation gate9. Documented failure modes reveal that rules lacking a closing \--- in the frontmatter silently fail to load, demonstrating a highly fragile parsing engine6. The description field is not merely informational; it is passed directly to the LLM to probabilistically determine if the rule should be loaded into context10. Consequently, any universal data model must treat Cursor's description fields as highly optimized prompt fragments rather than standard metadata.

### **AGENTS.md (The Cross-Tool Standard)**

Recognizing the fragmentation caused by proprietary dotfiles, an industry coalition standardized AGENTS.md as a universal instruction format11.

| Feature | Specification |
| :---- | :---- |
| **Exact File Locations** | AGENTS.md (root), nested AGENTS.md in subdirectories, AGENTS.override.md11. |
| **Format & Syntax** | Schema-free Markdown. Utilizes standardized headers and explicit exclusion blocks (\<\!-- BEGIN USER-SPECIFIED \--\>)11. |
| **Scoping & Activation** | Ancestor-based hierarchical jurisdiction. A file in ./frontend/AGENTS.md governs all child directories12. |
| **Size Limits** | Recommended under 150 lines. Defaults to truncating at a 32 KiB combined byte limit11. |
| **Precedence / Merging** | Accumulates sequentially from the root down. AGENTS.override.md replaces standard file loading in specific scopes12. |
| **Source Link** | \[cite: 11, 12, 13, 14\] |

**Architectural Implications:** The AGENTS.md standard reflects a paradigm shift from rigid governance to flexible guidance. The specification explicitly adopts an "Implementation Agnostic" philosophy12. However, its schema-free nature frequently results in massive, unmanageable files containing hundreds of ad-hoc directives, diluting the agent's attention15. Despite this, the standard's native adoption by GitHub Copilot, Codex, and Zed cements it as the highest-leverage synchronization target for achieving broad cross-platform compatibility11.

### **GitHub Copilot**

GitHub Copilot incorporates both the open AGENTS.md standard and its own proprietary path-scoped instruction system for fine-grained control11.

| Feature | Specification |
| :---- | :---- |
| **Exact File Locations** | .github/copilot-instructions.md (repo-wide), .github/instructions/\*\*/\*.instructions.md (path-scoped), \~/.copilot/copilot-instructions.md17. |
| **Format & Syntax** | Markdown with YAML frontmatter for scoped files, utilizing keywords such as applyTo (globs) and excludeAgent17. |
| **Scoping & Activation** | Global (User), Repository (Repo), Local. Scoped instructions trigger based on applyTo globs matching active files17. |
| **Size Limits** | Governed by dynamic server-side token limits based on the underlying Copilot infrastructure. |
| **Precedence / Merging** | Combines repo-wide copilot-instructions.md with AGENTS.md if both exist. Path-scoped files are applied server-side17. |
| **Source Link** | \[cite: 17, 18, 19\] |

**Architectural Implications:** Copilot's architecture explicitly bifurcates global repository rules from path-specific guidelines. However, field observations indicate unreliable activation of path-scoped .instructions.md files in the CLI unless manually requested by the user20. This unreliability necessitates redundant context inclusion for critical instructions, negatively impacting context window efficiency and creating synchronization challenges for centralized rule managers.

### **Windsurf**

Windsurf utilizes an overarching adaptive state memory system alongside standard rule files to provide persistent guidance.

| Feature | Specification |
| :---- | :---- |
| **Exact File Locations** | .windsurfrules (project root), global\_rules.md located in \~/.codeium/windsurf/memories/21. |
| **Format & Syntax** | Plain Markdown. Heavily relies on standardized headers and strict directive phrasing25. |
| **Scoping & Activation** | Global rules apply across all projects unless explicitly overridden by the local .windsurfrules25. |
| **Size Limits** | Rule files are hard-capped at 6,000 characters individually, with a total combined context limit of 12,000 characters26. |
| **Precedence / Merging** | Global rules take definitive priority over local rules if the combined character limit is exceeded26. |
| **Source Link** | \[cite: 21, 24, 25, 26\] |

**Architectural Implications:** Windsurf introduces the concept of an Adaptive Project State (APS), where the LLM maintains a self-editable memory of task progression and project milestones24. The strict character limits—capping individual files at 6,000 characters—force prompt architects to ruthlessly optimize rule sets. The fallback mechanism, which prioritizes global rules when limits are breached, guarantees that enterprise-wide security baselines remain intact even in bloated repositories26.

### **Cline / Roo Code**

Cline and its fork, Roo Code, utilize a highly complex configuration architecture that shifts behavior based on active personas.

| Feature | Specification |
| :---- | :---- |
| **Exact File Locations** | .clinerules/, .roo/rules/ (workspace), \~/.roo/rules/ (global), and .roo/rules-\[mode\_slug\]/ (mode-specific)27. |
| **Format & Syntax** | Markdown files. Mode-specific configurations utilize TOML \+ Markdown syntax (.mode.md)28. |
| **Scoping & Activation** | Highly dynamic. Rules activate based on the active mode (e.g., dev-react), open tabs, visible files, or specific glob matching27. |
| **Size Limits** | Relies on token management; utilizes dynamic Knowledge Base (KB) lookup triggers to prevent overloading the active prompt28. |
| **Precedence / Merging** | Mode-specific rules append to workspace rules. Files without frontmatter are always active27. |
| **Source Link** | \[cite: 27, 28, 29\] |

**Architectural Implications:** The architecture of Cline/Roo Code separates identity from procedure. A system\_prompt defines the persona, while isolated rule files dictate the procedures28. The introduction of Mode-Specific Rules (e.g., .roo/rules-dev-react/) allows the context to radically shift based on the task at hand28. This requires synchronization tooling to manage not just standard rule files, but interconnected webs of TOML metadata and conditional Knowledge Base triggers29.

### **Aider**

Aider is a terminal-based AI pair programmer that relies heavily on configuration files rather than traditional graphical interfaces.

| Feature | Specification |
| :---- | :---- |
| **Exact File Locations** | .aider.conf.yml (home or git root), .aiderignore, CONVENTIONS.md (or .aider.instructions.md)30. |
| **Format & Syntax** | YAML for configuration settings; plain Markdown for conventions30. |
| **Scoping & Activation** | Cascading configuration (Home ![][image1] Git Root ![][image1] Current Directory). .aiderignore applies globally unless \--subtree-only is active30. |
| **Size Limits** | No strict file limits, but the application recommends breaking down context using .aiderignore in large monorepos33. |
| **Precedence / Merging** | Files loaded last (Current Directory) take priority over global configurations30. |
| **Source Link** | \[cite: 30, 31, 32\] |

**Architectural Implications:** Aider distinguishes itself through tight integration with local git environments and command-line execution. A highly unique feature is its in-chat watch patterns: Aider continuously monitors the local file system for \# AI\! or // AI? comments, using these inline annotations as ephemeral instruction triggers to generate or refactor code34. A centralized context manager must handle Aider's .aider.conf.yml environment variable mappings to ensure cross-machine compatibility35.

### **Zed**

Zed integrates AI capabilities directly into a high-performance rust-based editor, transitioning from legacy .rules files to a modernized skills system.

| Feature | Specification |
| :---- | :---- |
| **Exact File Locations** | \~/.config/zed/AGENTS.md (personal), \<worktree\>/AGENTS.md, and \<worktree\>/.agents/skills/SKILL.md16. |
| **Format & Syntax** | Markdown with standard YAML frontmatter for skills. JSON for semantic token rules (global\_lsp\_settings)36. |
| **Scoping & Activation** | Global skills (\~/.agents/skills/) and Project-local skills. Activated via slash commands or autonomous model matching16. |
| **Size Limits** | The total size of all skill names and descriptions is strictly capped at a 50KB catalog budget for UI metadata rendering36. |
| **Precedence / Merging** | Project-local skills take absolute precedence over global skills sharing the same name36. |
| **Source Link** | \[cite: 16, 36, 37\] |

**Architectural Implications:** Zed has fully deprecated its legacy .rules files in favor of the AGENTS.md standard for persistent context, and an Anthropic-compatible .agents/skills/ format for reusable tasks16. The 50KB catalog budget is a hard constraint designed to maintain UI performance, meaning bloated skill descriptions will cause the agent to silently drop capabilities36.

### **JetBrains AI**

JetBrains AI Assistant embeds context management deeply into the IDE's graphical user interface, standardizing rules across its suite of tools.

| Feature | Specification |
| :---- | :---- |
| **Exact File Locations** | .aiassistant/rules/\*.md (project root)39. |
| **Format & Syntax** | Markdown files tied to IDE-specific configuration settings stored in XML/JSON metadata39. |
| **Scoping & Activation** | Governed by UI-configured invocation types: Always, Manually, By model decision, or By file patterns (globs)39. |
| **Size Limits** | Dynamically handled by the JetBrains AI service tokenizer40. |
| **Precedence / Merging** | Rules are automatically appended to each chat session based on their activation configuration39. |
| **Source Link** | \[cite: 39, 40\] |

**Architectural Implications:** JetBrains abstracts the metadata required for conditional rule loading away from the Markdown files themselves, relying instead on internal IDE configuration settings39. While this creates a seamless user experience, it severely complicates synchronization via third-party dotfile managers, as the activation logic (e.g., glob matching) is not self-contained within the .md asset.

### **Codex CLI**

OpenAI's Codex CLI leverages local configuration files alongside the AGENTS.md standard to create isolated, sandboxed agent environments.

| Feature | Specification |
| :---- | :---- |
| **Exact File Locations** | \~/.codex/config.toml, .codex/config.toml, .agents/skills/SKILL.md, AGENTS.override.md13. |
| **Format & Syntax** | TOML for configuration and environment variables; Markdown for instructions and skills41. |
| **Scoping & Activation** | Admin (/etc/) ![][image1] User (\~/.agents) ![][image1] Repo Root ![][image1] Nested Repo paths. Activated implicitly via LLM or explicitly via $ triggers13. |
| **Size Limits** | Context from AGENTS.md is limited by project\_doc\_max\_bytes (default 32 KiB). Skill descriptions are capped at 8,000 characters13. |
| **Precedence / Merging** | AGENTS.override.md supersedes local AGENTS.md. TOML configurations merge hierarchically13. |
| **Source Link** | \[cite: 13, 41, 42, 43\] |

**Architectural Implications:** Codex heavily prioritizes sandboxing and permission management. The .codex/config.toml dictates approval\_policy and sandbox\_mode (e.g., read-only vs danger-full-access), acting as a systemic governor over the instructions provided in AGENTS.md44. Integrating Codex with other platforms requires translating TOML permission policies into comparable formats, such as Claude Code's JSON settings46.

### **Gemini CLI**

The Gemini CLI introduces a highly flexible context aggregation engine equipped with native modularization features.

| Feature | Specification |
| :---- | :---- |
| **Exact File Locations** | \~/.gemini/GEMINI.md, ./GEMINI.md, commands/\*.toml, .gemini/settings.json47. |
| **Format & Syntax** | Markdown for context. Utilizes specialized @file.md import syntax and \!{...} execution blocks47. |
| **Scoping & Activation** | Global Context ![][image1] Environment/Workspace Context ![][image1] Just-in-time (JIT) Context (scanned when specific files are touched)47. |
| **Size Limits** | Designed for massive 1M+ token context windows, mitigating traditional file length constraints49. |
| **Precedence / Merging** | Concatenates all found files sequentially. More specific files override global defaults47. |
| **Source Link** | \[cite: 47, 48, 49, 50\] |

**Architectural Implications:** Gemini CLI resolves the issue of monolithic, bloated markdown files by natively supporting the @file.md import syntax within GEMINI.md47. Furthermore, its commands/\*.toml architecture allows developers to define custom prompt macros that can securely execute local shell scripts using \!{...} injection blocks48. This creates a powerful hybrid between static context files and dynamic, executable toolsets.

## **2\. Packaged and Bundled Formats**

While per-tool instruction files provide eager-loaded context, packaged formats represent lazy-loaded capabilities. These are invoked dynamically by the LLM only when semantically relevant, preserving crucial token space.

### **Claude Code and Codex Skills**

Both Claude Code and Codex have adopted a unified directory layout for "Skills."

| Feature | Specification |
| :---- | :---- |
| **Directory Layout** | \<scope\>/skills/\<skill-name\>/SKILL.md (e.g., \~/.claude/skills/deploy/SKILL.md)42. |
| **Frontmatter** | Strict YAML containing name, description, allowed-tools, disallowed-tools, and user-invocable51. |
| **Progressive Disclosure** | Only name and description are loaded into the initial system prompt. The full markdown instructions fetch dynamically upon invocation42. |

**Architectural Implications:** The progressive disclosure paradigm requires the description metadata to function as a highly optimized semantic trigger36. A centralized asset management system must store skills as multi-file bundles—combining frontmatter, scripts, and reference documentation—rather than singular text blobs, treating the description as the primary heuristic index for the LLM.

### **Model Context Protocol (MCP) Prompts and Resources**

The Model Context Protocol (MCP) standardizes how servers expose executable data to clients over JSON-RPC53.

| Feature | Specification |
| :---- | :---- |
| **Prompts Protocol** | prompts/list and prompts/get. Exposes templated workflows containing name, description, and arguments schemas53. |
| **Payload Structure** | Outputs support multi-modal content arrays, including Text, Image, and Embedded Resources53. |
| **Resources Protocol** | resources/list and resources/read. Contextual data addressed by standard URIs (e.g., file://, https://)54. |
| **Annotations** | Outputs support audience (user/assistant) and priority annotations to guide client rendering57. |

**Architectural Implications:** MCP entirely decouples prompt injection from the local filesystem. If an asset library acts as an MCP server, it can bypass static file synchronization entirely for supported clients, dynamically injecting curated context based on live IDE telemetry.

### **Cloud-Hosted Agent Limits (Custom GPTs & Gemini Gems)**

The limitations of cloud-hosted SaaS agents contrast sharply with the flexibility of local CLIs.

| Feature | Specification |
| :---- | :---- |
| **Custom GPTs (OpenAI)** | Hard architectural ceiling of exactly 8,000 characters for the core instruction field. Cannot exceed 10 Action slots or 20 Knowledge files (512MB each)58. |
| **Gemini Gems (Google)** | Prone to severe 1076 timeout errors when backend retrieval fails due to overloaded contextual history60. |
| **Instruction Integrity** | Cloud models natively prioritize internal safety formatting over user constraints (e.g., XML/Markdown tags), causing systemic instruction ignoring63. |

**Architectural Implications:** The severe operational limitations of cloud-hosted SaaS agents underline the necessity of local, CLI-driven AI workflows where context limits are bound only by the underlying foundational model's raw API context window, circumventing consumer SaaS database constraints.

### **Agent-Framework Templates**

Frameworks designed for autonomous applications require rigid, parsable structures.

| Feature | Specification |
| :---- | :---- |
| **LangChain Hub** | Adopts generic JSON or YAML files, accessed via the lc:// URI prefix, defining input variables and parser configurations64. |
| **PromptML (POML)** | An emerging XML/YAML-like Domain Specific Language utilizing strict semantic tags (\<role\>, \<task\>, \<context\>)66. |
| **POML Features** | Decoupled presentation styling, integrated templating engines, and AST validation engines for deterministic constraints67. |

**Architectural Implications:** While PromptML provides exceptional deterministic validation, its rigid structure conflicts with the unstructured reality of how developers actually write context today (e.g., AGENTS.md). An asset library must parse these rigid formats but remain flexible enough to export them as raw markdown for broader tool compatibility.

## **3\. Workflow Artifacts**

As AI transitions from autocompletion to autonomous task execution, multi-step workflow configurations are becoming tangible assets handled by developers. The following examines the formats structuring these operations.

### **Claude Code Subagents**

Claude Code supports spawning isolated subagents to perform complex research or refactoring without polluting the primary context window71.

| Feature | Specification |
| :---- | :---- |
| **Format & Location** | Defined as Markdown files with YAML frontmatter located in .claude/agents/72. |
| **Configuration** | Frontmatter dictates name, description, tools, disallowedTools, model, and permissionMode71. |
| **Execution** | Operates autonomously in isolated git worktrees, preventing state corruption during complex refactoring tasks72. |

### **GitHub Actions AI Workflows**

Agentic workflows are now being embedded directly into CI/CD pipelines to handle automated triage and review.

| Feature | Specification |
| :---- | :---- |
| **Format & Location** | Markdown files situated in .github/workflows/ containing natural language instructions74. |
| **Configuration** | Complex YAML frontmatter defines event triggers, model selections, and sanitized safe-outputs75. |
| **Execution** | Markdown instructions are compiled into deterministic .lock.yml GitHub Actions files via the gh aw compile command74. |

### **Low-Code Orchestration (n8n and Zapier)**

* **n8n:** AI Agent nodes frequently output unstructured text containing wrapped markdown blocks. Due to inconsistent JSON formatting by LLMs, workflows require heavy use of indexOf or regex node workarounds to sanitize and extract actionable data78.  
* **Zapier:** Employs specialized "Formatter with AI" steps, keeping workflow orchestration strictly deterministic while treating the LLM as an isolated data transformation node, circumventing the unreliability of native JSON generation79.

### **LangGraph Configurations**

* **Format:** langgraph.json82.  
* **Configuration:** Specifies dependencies, environment variables (env), and graphs mappings (e.g., file.py:graph\_variable)84.  
* **Execution:** Serves as a deployment manifest for Docker container builds and LangSmith servers rather than acting as direct LLM instruction context84.

**Architectural Implications:** "Workflow" should **not** be a first-class asset kind at launch. The architectures of LangGraph, n8n, and GitHub Actions are deeply intertwined with their respective proprietary execution runtimes and server deployments. However, Subagents (e.g., Claude Code Agent definitions) share the exact structural invariants of Skills (Metadata \+ Markdown instructions) and should be classified as a variant of the "Harness" asset kind.

## **4\. Existing Synchronization and Management Tooling**

The ecosystem is actively reacting to the chaos of managing overlapping context dotfiles across different IDEs and CLIs. Two diverging philosophies have emerged: compiler-driven synchronization versus universal standardization.

### **CLI Synchronizers (Rulesync)**

Tools like Rulesync treat AI configurations as a compilation target, attempting to unify disparate systems through centralized translation86.

| Aspect | Evaluation |
| :---- | :---- |
| **Mechanics** | Users maintain a source of truth in a .rulesync/ directory. A configuration file (rulesync.jsonc) dictates which features are exported to which targets (Cursor, ClaudeCode, Copilot)87. |
| **Strengths** | Facilitates seamless migration and handles structural translations automatically (e.g., generating .mdc YAML frontmatter from raw markdown)87. |
| **Weaknesses** | Relies on deterministic heuristics that struggle with edge-case metadata mappings. Imposes a cumbersome build step onto prompt authoring, disrupting rapid iteration loops86. |

### **The Emergence of the Interchange Format (AGENTS.md)**

Conversely, a robust faction of the ecosystem is deprecating synchronization tooling entirely by universally adopting AGENTS.md11. Because AGENTS.md is supported natively by GitHub Copilot, Cursor, Codex CLI, Zed, and Windsurf, it is rapidly becoming the de-facto interchange standard11.  
**Architectural Implications:** The success of AGENTS.md demonstrates that developers prefer shared, zero-configuration files over complex sync pipelines. However, its lack of strict schema prevents it from supporting advanced features like progressive skill disclosure or stringent tool restrictions. The ecosystem is decisively splitting into two tiers: AGENTS.md for universal, low-fidelity global context, and tool-specific proprietary formats (.mdc, SKILL.md) for high-fidelity, highly constrained agentic behaviors.

## **5\. Strategic Design Recommendations**

Based on the systems design philosophy of "Context Permaculture"—modeling the invariants and parameterizing the variants—the following architecture is recommended to seamlessly bridge the gap between unstructured markdown and proprietary IDE runtimes92.

### **5.1 Minimal Asset-Kind Set for Launch**

To round-trip without data loss into tools like Cursor, Claude Code, and Copilot, the launch taxonomy must support a registry of typed assets92.

| Asset Kind | Definition | Required Metadata | Primary Sync Targets |
| :---- | :---- | :---- | :---- |
| **Prompt** | Raw, unstructured contextual data. | title, description | Appended to AGENTS.md, injected via MCP Prompts. |
| **Rule** | Guidelines tied to specific file patterns or logical scenarios. | globs (array), alwaysApply (boolean), description (semantic trigger). | Cursor .mdc files, Copilot .instructions.md. |
| **Skill** | Executable capabilities progressively disclosed to the agent. | name, description, allowed-tools (array), user-invocable (boolean). | .claude/skills/SKILL.md, .codex/skills/, Zed .agents/skills/. |
| **Harness** | A composition graph representing an entire working set, including subagents and linked skills. | model, permissionMode, graph edges. | .claude/agents/\*.md, rulesync.jsonc profiles. |

### **5.2 Canonical Internal Representation**

To map cleanly across all targets, the platform should adopt a **File Bundle \+ Strict YAML Frontmatter** architecture.

* **Structure:** Every asset is treated internally as a directory bundle containing a primary index.md.  
* **Frontmatter:** The index.md begins with a strictly validated YAML block. This natively fulfills Cursor's .mdc, Claude's SKILL.md, and Copilot's .instructions.md requirements.  
* **Decoupled Payloads:** Scripts, templates, or external files required by the asset reside alongside index.md within the bundle. When synced to a rudimentary environment (e.g., a pure AGENTS.md append), the system gracefully degrades by serializing only the textual instructions.

This structure allows the underlying database to maintain dual content shapes: inline text for rapid rendering of raw prompts, and cloud storage bundles for complex, multi-file skills92.

### **5.3 The 5 Highest-Value Sync Targets (Ranked)**

Prioritization is determined by a matrix of user population footprint multiplied by parsing strictness (user pain).

1. **Cursor Rules (.cursor/rules/\*.mdc)**  
   * *Rationale:* Massive, rapidly growing user base of power developers. High pain point because malformed YAML frontmatter or incorrectly structured globs cause rules to silently fail without warning6.  
2. **AGENTS.md / Universal Markdown**  
   * *Rationale:* The widest coverage footprint. One sync target simultaneously updates GitHub Copilot, Codex, Zed, RooCode, and Aider11. Limits are managed via smart truncation logic11.  
3. **Claude Code / Codex Skills (.claude/skills/SKILL.md)**  
   * *Rationale:* The frontier of agentic coding. Developers are heavily investing in reusable workflows but struggle with the boilerplate of directory generation and tool-permission mapping51.  
4. **Model Context Protocol (MCP)**  
   * *Rationale:* Bypasses the filesystem entirely. As an MCP server, the platform dynamically exposes its entire cloud library directly to Claude Desktop, Zed, and Cursor without writing fragile dotfiles53.  
5. **GitHub Copilot Instructions (.github/copilot-instructions.md)**  
   * *Rationale:* Deep enterprise penetration. Teams require strict synchronization of repository rules utilizing the applyTo frontmatter mapping for precise contextual control within vast monorepos17.

The entropy of context injection formats is symptomatic of a transitional phase in AI developer tooling. As paradigms shift from static governance to dynamic, lazy-loaded capabilities, the complexity of managing these assets locally is exceeding the threshold of manual maintenance. Adopting a canonical YAML-frontmatter bundle system and prioritizing these high-value sync targets will ensure structural resilience against the inevitable churn of proprietary IDE specifications.

#### **Works cited**

1. How Claude remembers your project \- Claude Code Docs, [https://code.claude.com/docs/en/memory](https://code.claude.com/docs/en/memory)  
2. Hooks reference \- Claude Code Docs, [https://code.claude.com/docs/en/hooks](https://code.claude.com/docs/en/hooks)  
3. Automate actions with hooks \- Claude Code Docs, [https://code.claude.com/docs/en/hooks-guide](https://code.claude.com/docs/en/hooks-guide)  
4. Native Claude Code hooks compatibility (PreToolUse, PostToolUse, Stop) · Issue \#12472 · anomalyco/opencode \- GitHub, [https://github.com/anomalyco/opencode/issues/12472](https://github.com/anomalyco/opencode/issues/12472)  
5. karanb192/claude-code-hooks \- GitHub, [https://github.com/karanb192/claude-code-hooks](https://github.com/karanb192/claude-code-hooks)  
6. How to figure out why your cursor rules aren't working \- Guides, [https://forum.cursor.com/t/how-to-figure-out-why-your-cursor-rules-arent-working/152439](https://forum.cursor.com/t/how-to-figure-out-why-your-cursor-rules-arent-working/152439)  
7. awesome-cursor-rules-mdc/cursor-rules-reference.md at main \- GitHub, [https://github.com/sanjeed5/awesome-cursor-rules-mdc/blob/main/cursor-rules-reference.md](https://github.com/sanjeed5/awesome-cursor-rules-mdc/blob/main/cursor-rules-reference.md)  
8. Mode frontmatter field in .mdc rules for built-in mode targeting (Agent/Plan/Debug/Ask), [https://forum.cursor.com/t/mode-frontmatter-field-in-mdc-rules-for-built-in-mode-targeting-agent-plan-debug-ask/157675](https://forum.cursor.com/t/mode-frontmatter-field-in-mdc-rules-for-built-in-mode-targeting-agent-plan-debug-ask/157675)  
9. justdo/.cursor/rules/999-mdc-format.mdc at master · justdoinc/justdo · GitHub, [https://github.com/justdoinc/justdo/blob/master/.cursor/rules/999-mdc-format.mdc](https://github.com/justdoinc/justdo/blob/master/.cursor/rules/999-mdc-format.mdc)  
10. A Deep Dive into Cursor Rules (\> 0.45) \- Guides, [https://forum.cursor.com/t/a-deep-dive-into-cursor-rules-0-45/60721](https://forum.cursor.com/t/a-deep-dive-into-cursor-rules-0-45/60721)  
11. Agents.md best practices · GitHub \- Gist, [https://gist.github.com/0xfauzi/7c8f65572930a21efa62623557d83f6e](https://gist.github.com/0xfauzi/7c8f65572930a21efa62623557d83f6e)  
12. Proposal: AGENTS.md v1.1: Making Implicit Semantics Explicit, Clarifying Scope, and Recommendation for Progressive Disclosure · Issue \#135 \- GitHub, [https://github.com/agentsmd/agents.md/issues/135](https://github.com/agentsmd/agents.md/issues/135)  
13. Custom instructions with AGENTS.md – Codex | OpenAI Developers, [https://developers.openai.com/codex/guides/agents-md](https://developers.openai.com/codex/guides/agents-md)  
14. AGENTS.md Guidelines \- Best practices for AI coding assistant instruction files \- GitHub Gist, [https://gist.github.com/jerdaw/3917eab775d3e4bbcf37928101fbc3db](https://gist.github.com/jerdaw/3917eab775d3e4bbcf37928101fbc3db)  
15. A Complete Guide To AGENTS.md \- GitHub Gist, [https://gist.github.com/skyzyx/c91d9be9e5050c85e81ccbcca022ff6b](https://gist.github.com/skyzyx/c91d9be9e5050c85e81ccbcca022ff6b)  
16. Agent Instructions \- Zed, [https://zed.dev/docs/ai/instructions.html](https://zed.dev/docs/ai/instructions.html)  
17. Adding custom instructions for GitHub Copilot CLI, [https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-custom-instructions](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-custom-instructions)  
18. Your first custom instructions \- GitHub Docs, [https://docs.github.com/en/copilot/tutorials/customization-library/custom-instructions/your-first-custom-instructions](https://docs.github.com/en/copilot/tutorials/customization-library/custom-instructions/your-first-custom-instructions)  
19. Adding repository custom instructions for GitHub Copilot in your IDE, [https://docs.github.com/en/copilot/how-tos/configure-custom-instructions-in-your-ide/add-repository-instructions-in-your-ide](https://docs.github.com/en/copilot/how-tos/configure-custom-instructions-in-your-ide/add-repository-instructions-in-your-ide)  
20. Copilot CLI does not consistently apply path-scoped .instructions.md files when editing matching files \#2909 \- GitHub, [https://github.com/github/copilot-cli/issues/2909](https://github.com/github/copilot-cli/issues/2909)  
21. Devin Desktop \- Advanced, [https://docs.devin.ai/desktop/advanced](https://docs.devin.ai/desktop/advanced)  
22. smart-coding-mcp/docs/ide-setup/windsurf.md at main \- GitHub, [https://github.com/omar-haris/smart-coding-mcp/blob/main/docs/ide-setup/windsurf.md](https://github.com/omar-haris/smart-coding-mcp/blob/main/docs/ide-setup/windsurf.md)  
23. A curated list of awesome global\_rules.md and .windsurfrules files \- GitHub, [https://github.com/balqaasem/awesome-windsurfrules/](https://github.com/balqaasem/awesome-windsurfrules/)  
24. akapug/RuleSurf: Supercharged global and workspace rules system for WindSurf IDE \- GitHub, [https://github.com/akapug/RuleSurf](https://github.com/akapug/RuleSurf)  
25. windsurf global rules \- GitHub Gist, [https://gist.github.com/muratkeremozcan/2fa569c9ba5a2a6459217aa01e42bcef](https://gist.github.com/muratkeremozcan/2fa569c9ba5a2a6459217aa01e42bcef)  
26. aurelia/docs/user-docs/developer-guides/developing-with-ai/windsurf-rules-example.md at master \- GitHub, [https://github.com/aurelia/aurelia/blob/master/docs/user-docs/developer-guides/developing-with-ai/windsurf-rules-example.md](https://github.com/aurelia/aurelia/blob/master/docs/user-docs/developer-guides/developing-with-ai/windsurf-rules-example.md)  
27. Rules \- Cline documentation, [https://docs.cline.bot/customization/cline-rules](https://docs.cline.bot/customization/cline-rules)  
28. 02\_Custom\_Instructions\_Rules · jezweb/roo-commander Wiki \- GitHub, [https://github.com/jezweb/roo-commander/wiki/02\_Custom\_Instructions\_Rules](https://github.com/jezweb/roo-commander/wiki/02_Custom_Instructions_Rules)  
29. 01\_Custom\_Modes · jezweb/roo-commander Wiki \- GitHub, [https://github.com/jezweb/roo-commander/wiki/01\_Custom\_Modes](https://github.com/jezweb/roo-commander/wiki/01_Custom_Modes)  
30. YAML config file | aider, [https://aider.chat/docs/config/aider\_conf.html](https://aider.chat/docs/config/aider_conf.html)  
31. Community-contributed convention files for use with aider \- GitHub, [https://github.com/Aider-AI/conventions](https://github.com/Aider-AI/conventions)  
32. Only aider ignore file works with \--subtree-only option is .aiderignore \#3422 \- GitHub, [https://github.com/Aider-AI/aider/issues/3422](https://github.com/Aider-AI/aider/issues/3422)  
33. FAQ | aider, [https://aider.chat/docs/faq.html](https://aider.chat/docs/faq.html)  
34. Aider in your IDE, [https://aider.chat/docs/usage/watch.html](https://aider.chat/docs/usage/watch.html)  
35. Configuration \- Aider, [https://aider.chat/docs/config.html](https://aider.chat/docs/config.html)  
36. Agent Skills \- Zed, [https://zed.dev/docs/ai/skills](https://zed.dev/docs/ai/skills)  
37. Semantic Tokens and Syntax Highlighting \- Zed, [https://zed.dev/docs/semantic-tokens](https://zed.dev/docs/semantic-tokens)  
38. Support for Agent Skills · Issue \#49057 · zed-industries/zed \- GitHub, [https://github.com/zed-industries/zed/issues/49057](https://github.com/zed-industries/zed/issues/49057)  
39. Configure project rules | AI Assistant Documentation \- JetBrains, [https://www.jetbrains.com/help/ai-assistant/configure-project-rules.html](https://www.jetbrains.com/help/ai-assistant/configure-project-rules.html)  
40. Manage AI Enterprise | IDE Services Documentation \- JetBrains, [https://www.jetbrains.com/help/ide-services/manage-aie.html](https://www.jetbrains.com/help/ide-services/manage-aie.html)  
41. Unrolling the Codex agent loop | OpenAI, [https://openai.com/index/unrolling-the-codex-agent-loop/](https://openai.com/index/unrolling-the-codex-agent-loop/)  
42. Agent Skills – Codex | OpenAI Developers, [https://developers.openai.com/codex/skills](https://developers.openai.com/codex/skills)  
43. Config basics – Codex | OpenAI Developers, [https://developers.openai.com/codex/config-basic](https://developers.openai.com/codex/config-basic)  
44. Using Claude Code with Codex CLI \- GitHub, [https://github.com/shakacode/claude-code-commands-skills-agents/blob/main/docs/claude-code-with-codex.md](https://github.com/shakacode/claude-code-commands-skills-agents/blob/main/docs/claude-code-with-codex.md)  
45. feiskyer/codex-settings: OpenAI Codex CLI settings, configurations, skills and prompts for vibe coding \- GitHub, [https://github.com/feiskyer/codex-settings](https://github.com/feiskyer/codex-settings)  
46. Sync Codex and Claude Code configs: skills, agents, MCP, permissions, [https://community.openai.com/t/sync-codex-and-claude-code-configs-skills-agents-mcp-permissions/1380517](https://community.openai.com/t/sync-codex-and-claude-code-configs-skills-agents-mcp-permissions/1380517)  
47. Provide context with GEMINI.md files \- GitHub, [https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/gemini-md.md](https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/gemini-md.md)  
48. gemini-cli/docs/cli/custom-commands.md at main \- GitHub, [https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/custom-commands.md](https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/custom-commands.md)  
49. google-gemini/gemini-cli: An open-source AI agent that brings the power of Gemini directly into your terminal. \- GitHub, [https://github.com/google-gemini/gemini-cli](https://github.com/google-gemini/gemini-cli)  
50. addyosmani/gemini-cli-tips \- GitHub, [https://github.com/addyosmani/gemini-cli-tips](https://github.com/addyosmani/gemini-cli-tips)  
51. Extend Claude with skills \- Claude Code Docs, [https://code.claude.com/docs/en/skills](https://code.claude.com/docs/en/skills)  
52. 使用skills 扩展Claude, [https://code.claude.com/docs/zh-CN/skills](https://code.claude.com/docs/zh-CN/skills)  
53. Prompts \- Model Context Protocol, [https://modelcontextprotocol.io/specification/2025-06-18/server/prompts](https://modelcontextprotocol.io/specification/2025-06-18/server/prompts)  
54. Resources \- Model Context Protocol, [https://modelcontextprotocol.io/specification/2025-03-26/server/resources](https://modelcontextprotocol.io/specification/2025-03-26/server/resources)  
55. modelcontextprotocol/ruby-sdk at sich.dev \- GitHub, [https://github.com/modelcontextprotocol/ruby-sdk?ref=sich.dev](https://github.com/modelcontextprotocol/ruby-sdk?ref=sich.dev)  
56. The official Ruby SDK for the Model Context Protocol. \- GitHub, [https://github.com/modelcontextprotocol/ruby-sdk](https://github.com/modelcontextprotocol/ruby-sdk)  
57. Resources \- Model Context Protocol, [https://modelcontextprotocol.io/specification/2025-06-18/server/resources](https://modelcontextprotocol.io/specification/2025-06-18/server/resources)  
58. Request a new feature for ChatGPT \- Page 8 \- OpenAI Developer Community, [https://community.openai.com/t/request-a-new-feature-for-chatgpt/41624?page=8](https://community.openai.com/t/request-a-new-feature-for-chatgpt/41624?page=8)  
59. Custom GPT Limits and Overcoming them \- OpenAI Developer Community, [https://community.openai.com/t/custom-gpt-limits-and-overcoming-them/1061473](https://community.openai.com/t/custom-gpt-limits-and-overcoming-them/1061473)  
60. I am getting a 1076 code when I initiate a prompt \- Gemini Apps Community \- Google Help, [https://support.google.com/gemini/thread/435439509/i-am-getting-a-1076-code-when-i-initiate-a-prompt?hl=en-gb](https://support.google.com/gemini/thread/435439509/i-am-getting-a-1076-code-when-i-initiate-a-prompt?hl=en-gb)  
61. Can't send any new messages in existing chat for 24 hours \- Gemini Apps Community, [https://support.google.com/gemini/thread/431147703/can%E2%80%99t-send-any-new-messages-in-existing-chat-for-24-hours?hl=en](https://support.google.com/gemini/thread/431147703/can%E2%80%99t-send-any-new-messages-in-existing-chat-for-24-hours?hl=en)  
62. I am getting a 1076 code when I initiate a prompt \- Gemini Apps Community \- Google Help, [https://support.google.com/gemini/thread/435439509/i-am-getting-a-1076-code-when-i-initiate-a-prompt?hl=en-GB](https://support.google.com/gemini/thread/435439509/i-am-getting-a-1076-code-when-i-initiate-a-prompt?hl=en-GB)  
63. Instructions for Gemini (personalized context) \- Gemini Apps Community \- Google Help, [https://support.google.com/gemini/thread/419906206/instructions-for-gemini-personalized-context?hl=en](https://support.google.com/gemini/thread/419906206/instructions-for-gemini-personalized-context?hl=en)  
64. langchain/libs/core/langchain\_core/prompts/loading.py at master \- GitHub, [https://github.com/langchain-ai/langchain/blob/master/libs/core/langchain\_core/prompts/loading.py](https://github.com/langchain-ai/langchain/blob/master/libs/core/langchain_core/prompts/loading.py)  
65. langchain-hub/prompts/README.md at master \- GitHub, [https://github.com/hwchase17/langchain-hub/blob/master/prompts/README.md](https://github.com/hwchase17/langchain-hub/blob/master/prompts/README.md)  
66. GhennadiiMir/poml: Ruby implementation of Prompt Orchestration Markup Language \- GitHub, [https://github.com/GhennadiiMir/poml](https://github.com/GhennadiiMir/poml)  
67. microsoft/poml: Prompt Orchestration Markup Language \- GitHub, [https://github.com/microsoft/poml](https://github.com/microsoft/poml)  
68. PromptML (Prompt Markup Language) \- from Vidura AI \- GitHub, [https://github.com/narenaryan/promptml](https://github.com/narenaryan/promptml)  
69. Caripson/ProML: Prompt Markup Language \- GitHub, [https://github.com/Caripson/ProML](https://github.com/Caripson/ProML)  
70. DPML \- Deepractice Prompt Markup Language \- GitHub, [https://github.com/Deepractice/DPML](https://github.com/Deepractice/DPML)  
71. Create custom subagents \- Claude Code Docs, [https://code.claude.com/docs/en/sub-agents](https://code.claude.com/docs/en/sub-agents)  
72. claude-howto/04-subagents/README.md at main \- GitHub, [https://github.com/luongnv89/claude-howto/blob/main/04-subagents/README.md](https://github.com/luongnv89/claude-howto/blob/main/04-subagents/README.md)  
73. sub-agents.md \- hyperskill/claude-code-marketplace · GitHub, [https://github.com/hyperskill/claude-code-marketplace/blob/main/docs/sub-agents.md](https://github.com/hyperskill/claude-code-marketplace/blob/main/docs/sub-agents.md)  
74. Creating Agentic Workflows \- GitHub Pages, [https://github.github.com/gh-aw/setup/creating-workflows/](https://github.github.com/gh-aw/setup/creating-workflows/)  
75. About Workflows | GitHub Agentic Workflows, [https://github.github.com/gh-aw/introduction/overview/](https://github.github.com/gh-aw/introduction/overview/)  
76. AI GitHub Action \- GitHub Marketplace, [https://github.com/marketplace/actions/ai-github-action](https://github.com/marketplace/actions/ai-github-action)  
77. Frontmatter Reference | GitHub Agentic Workflows, [https://github.github.com/gh-aw/reference/frontmatter-full/](https://github.github.com/gh-aw/reference/frontmatter-full/)  
78. AI Agent node: JSON output buried in raw text — every workflow needs indexOf/regex Code node to extract · Issue \#27726 · n8n-io/n8n \- GitHub, [https://github.com/n8n-io/n8n/issues/27726](https://github.com/n8n-io/n8n/issues/27726)  
79. Get started with Formatter \- Zapier Help Center, [https://help.zapier.com/hc/en-us/articles/8496212590093-Get-started-with-Formatter](https://help.zapier.com/hc/en-us/articles/8496212590093-Get-started-with-Formatter)  
80. Zapier Formatter: Automatically format text the way you want, [https://zapier.com/blog/zapier-formatter-guide/](https://zapier.com/blog/zapier-formatter-guide/)  
81. How to orchestrate AI workflows in 7 steps \- Zapier, [https://zapier.com/blog/ai-orchestration-workflows/](https://zapier.com/blog/ai-orchestration-workflows/)  
82. Context schema (configurable fields) not shown in Studio when using StateSchema · Issue \#2466 · langchain-ai/langgraphjs \- GitHub, [https://github.com/langchain-ai/langgraphjs/issues/2466](https://github.com/langchain-ai/langgraphjs/issues/2466)  
83. langgraph-example/langgraph.json at main · langchain-ai/langgraph-example \- GitHub, [https://github.com/langchain-ai/langgraph-example/blob/main/langgraph.json](https://github.com/langchain-ai/langgraph-example/blob/main/langgraph.json)  
84. Application structure \- Docs by LangChain, [https://docs.langchain.com/langsmith/application-structure](https://docs.langchain.com/langsmith/application-structure)  
85. LangGraph CLI \- Docs by LangChain, [https://docs.langchain.com/langsmith/cli](https://docs.langchain.com/langsmith/cli)  
86. GitHub \- adityatomar-neurabit/rulesync-aicmd: Ultimate Rulesync AI Agent CLI Tool 2026 – Streamline Coding Workflows Fast, [https://github.com/adityatomar-neurabit/rulesync-aicmd](https://github.com/adityatomar-neurabit/rulesync-aicmd)  
87. dyoshikawa/rulesync: A Utility CLI for AI Coding Agents \- GitHub, [https://github.com/dyoshikawa/rulesync](https://github.com/dyoshikawa/rulesync)  
88. rulesync.jsonc \- redhat-developer/rhdh \- GitHub, [https://github.com/redhat-developer/rhdh/blob/main/rulesync.jsonc](https://github.com/redhat-developer/rhdh/blob/main/rulesync.jsonc)  
89. rulesync/rulesync.jsonc at main · dyoshikawa/rulesync \- GitHub, [https://github.com/dyoshikawa/rulesync/blob/main/rulesync.jsonc](https://github.com/dyoshikawa/rulesync/blob/main/rulesync.jsonc)  
90. Support current Claude Code skill frontmatter fields · Issue \#1629 · dyoshikawa/rulesync, [https://github.com/dyoshikawa/rulesync/issues/1629](https://github.com/dyoshikawa/rulesync/issues/1629)  
91. Documentation Suggestion: Recommend AGENTS.md for Coding Conventions to Support Agent Rules Standard Description · Issue \#4363 · Aider-AI/aider \- GitHub, [https://github.com/Aider-AI/aider/issues/4363](https://github.com/Aider-AI/aider/issues/4363)  
92. Prompt Atrium, uploaded:Prompt Atrium

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAWCAYAAADNX8xBAAAAU0lEQVR4XmNgGAWjgGSwF12AXPAPXYBcYAPEZeiC5IJzQGyOLmhCJr4FxPsYkIAfmfgaFLMwUAAmArE3uiCpQBGIO9EFyQGf0AXIBYfRBUYBHQEAuRgREuSc/3IAAAAASUVORK5CYII=>
