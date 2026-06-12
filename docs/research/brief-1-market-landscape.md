# Research brief 1 — Market landscape for an "AI working set" library

*Kickoff prompt for a deep-research agent. Self-contained; paste as-is.*

---

You are researching the market for **PromptAtrium**, a product being
repositioned as "the home for your AI working set": one library for every
context-injection artifact a person feeds an AI — prompts, system prompts,
skills (e.g. Claude Code skills), rules files (`.cursor/rules`,
`AGENTS.md`, `CLAUDE.md`, Copilot instructions), and workflows. It has two
surfaces (a private Google-Keep-style "Stash" and a public,
results-attached gallery, the "Atrium") plus programmatic access via an
MCP server and a CLI that syncs assets into AI tools. Target users span
total beginners (office workers told to use Copilot), content creators
(generation prompts + their outputs), and professional developers.
It is a solo-founder, near-zero-budget project; the near-term goal is
daily-use utility and a demo that makes the potential legible, not revenue.

Produce a fact-checked, cited report (current as of mid-2026) answering:

1. **Competitive map.** Who occupies each adjacent category today, and how
   actively maintained are they?
   - Prompt management / prompt-ops for teams (PromptLayer, Langfuse,
     Helicone, Vellum, etc.) — note which are eval/observability-first.
   - Prompt marketplaces & consumer libraries (PromptBase, FlowGPT,
     AIPRM, Snack Prompt, prompts.chat, etc.) — which are alive, which
     are zombies, and why.
   - Per-tool registries & directories: cursor.directory, Claude Code
     skill collections/registries, MCP server registries (Smithery, mcp.so,
     official registries), GPT stores, Poe bots — coverage, quality bar,
     ownership.
   - Creator-side galleries: Civitai, Midjourney community feeds,
     OpenArt, Prompt Hunt — how they tie prompts to results.
   - Generic tools people actually use instead: Notion templates, GitHub
     gists/awesome-lists, Obsidian vaults, Raycast snippets, TextExpander.
2. **The gap check.** Is anyone already doing cross-tool, cross-skill-level
   "context asset" management with sync (especially MCP- or CLI-based
   sync of rules/skills into editors)? Search hard for new 2025–2026
   entrants, including open-source projects (e.g. dotfiles-for-AI,
   rulesync-type tools, agents.md tooling). Name names; this is the most
   important section.
3. **Density lessons.** For two-sided/UGC products adjacent to this
   (Civitai, PromptBase, GitHub itself, Product Hunt, Are.na, Pinterest
   early days): what got them to content density before network effects?
   What did failed prompt-sharing sites do wrong (find at least 3
   post-mortems or credible analyses)?
4. **Demand signals.** Evidence (search trends, Reddit/HN threads,
   GitHub stars growth, job-post language) that people are feeling the
   "my AI config is scattered" pain in 2025–2026, and what words they use
   for it (this informs naming/SEO).
5. **Positioning recommendation.** Given all of the above: the sharpest
   wedge for a zero-budget solo project, what to *not* build because an
   incumbent owns it, and the 3 most defensible differentiators.

Format: executive summary (≤1 page), then sections matching the questions,
with inline citations to sources. Flag low-confidence claims explicitly.
