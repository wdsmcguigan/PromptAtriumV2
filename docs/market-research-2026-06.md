# PromptAtrium — Market Research Report

**"The home for your AI working set"** · Compiled 2026-06-11 · Current as of mid-2026

> **Confidence legend:** Claims are marked **[H]** high (primary source), **[M]** medium
> (secondary/corroborated), **[L]** low (single source, estimate, or inference). Negative
> claims ("nobody does X") are inherently un-provable and flagged as such.

---

## Executive Summary

**The wedge is real but narrower than it was six months ago.** Three layers sit between
PromptAtrium and the "AI working set" thesis, and they are filling at very different speeds:

1. **The sync/convert layer is commoditized.** At least six actively-maintained open-source
   CLIs already turn one rules file into every editor's format — `rulesync` (released a new
   version *the day of this research*), `ruler` (~2.7k stars), Block's `ai-rules`, `ai-rulez`,
   `agent_sync`, `agentsmesh` [H]. MCP/CLI install of skills into editors is a solved primitive
   that Vercel and Smithery give away [H]. **Do not build sync as the differentiator — it is
   table stakes.**

2. **The public-registry layer is being captured by capital and incumbents.** **Tessl** raised
   **$125M** to be "the package manager for agent skills and context" (public registry + private
   workspaces) [H]. **Vercel's Skills.sh** indexes 600k+ skills [M]. Anthropic runs the official
   skills repo (149k stars) and a plugin marketplace; cursor.directory owns Cursor rules; the
   official MCP registry + Smithery/Glama/PulseMCP own MCP discovery [H]. **Do not try to be the
   registry-of-everything.**

3. **The combined product — public results-attached gallery + private Keep-style stash +
   cross-editor sync, spanning prompts AND skills AND rules, organized for beginners through
   pros — is only *partially* occupied.** The closest single competitor is **PromptHub
   (prompthub.click)**, an AGPL OSS tool that bundles a curated public skill library + AES-256
   local-private storage + one-click distribution to 15+ tools [H] — but it is skill/prompt-
   centric, has no results-attached gallery, and no skill-level tiering. **No product found
   markets the full stack PromptAtrium describes** [M, negative claim].

**Meanwhile the consumer prompt-marketplace category is dying as a business** (AIPRM backlash,
Snack Prompt sold to a penny-stock shell, PromptBase under 1M visits, three documented post-
mortems on why prompts aren't defensible) [H/M] — while **the free open library wins**
(prompts.chat at 164k stars) [H]. The pain is genuine and has a vocabulary: "**context
engineering**," "**single source of truth**," "**prompt/agent sprawl**," "**scattered**." Avoid
"**working set**" — it is *not* in the vernacular [M].

**Sharpest wedge:** the **beginner + content-creator** end (where Tessl, Packmind, and the
dotfiles crowd are all aimed at pro developers), delivered as a **daily-use single-player stash**
with a **results-attached public gallery** as the density engine. The three defensible moats are
**(a) results-attached reproducibility** (gallery ties asset→output, which no rules-sync tool
does), **(b) cross-skill-level curation/onboarding** (a genuinely unoccupied axis), and **(c)
being the one home across *all* artifact types** (prompts + skills + rules + workflows) rather
than skills-only or rules-only.

---

## 1. Competitive Map

### 1A. Prompt management / prompt-ops for teams

The mid-2026 story is a **consolidation wave**: two of the four were acquired within ~6 weeks.

| Player | Classification | Status (mid-2026) | Evidence |
|---|---|---|---|
| **PromptLayer** | **Prompt-management-first** (CMS + eval + observability); pitches *non-technical* domain experts | Independent, seed-stage. $4.8M seed led by ScOp VC, announced 2025-02-07 [H]. Company-stated 13× revenue growth, 10k+ users [M]. | [TechCrunch](https://techcrunch.com/2025/02/07/promptlayer-is-building-tools-to-put-non-techies-in-the-drivers-seat-of-ai-app-development/), [promptlayer.com](https://www.promptlayer.com/) |
| **Langfuse** | **Observability-first** (tracing + evals + prompt mgmt); all-in on OpenTelemetry | **Acquired by ClickHouse, mid-Jan 2026**, alongside ClickHouse's $400M Series D at $15B valuation. 20,470 GitHub stars at acquisition (live repo now higher); 2,000+ paying customers incl. 19 of Fortune 50. Stays OSS/self-hostable. [H] | [ClickHouse blog](https://clickhouse.com/blog/clickhouse-acquires-langfuse-open-source-llm-observability), [SiliconANGLE](https://siliconangle.com/2026/01/16/database-maker-clickhouse-raises-400m-acquires-ai-observability-startup-langfuse/) |
| **Helicone** | **Observability-first** (logging/proxy + AI gateway) | **Acquired by Mintlify, 2026-03-03**; founders joined; product now in **maintenance mode** (security/bug fixes only). ~5.8k stars; 16k+ orgs, 14.2T tokens at acquisition [H]. | [Mintlify blog](https://www.mintlify.com/blog/mintlify-acquires-helicone), [helicone.ai](https://www.helicone.ai/blog/joining-mintlify) |
| **Vellum** | **Eval-/orchestration-first**, enterprise | Independent, **$20M Series A** led by Leaders Fund, announced 2025-07-10. Customers: Drata, Swisscom, Redfin, Headspace [H]. | [BusinessWire](https://www.businesswire.com/news/home/20250710009580/en/), [Vellum blog](https://www.vellum.ai/blog/announcing-our-20m-series-a) |

**Read:** Only **PromptLayer** is genuinely "prompt-library-shaped," and it targets teams building
LLM *apps* — not individuals managing editor config. None push assets into `.cursor/rules` or
`CLAUDE.md`. They are adjacent, not overlapping. The acquisition wave signals investors see
standalone prompt-ops as a feature, not a company [M, interpretation].

### 1B. Prompt marketplaces & consumer libraries — mostly commoditized

| Site | Verdict | Why | Evidence |
|---|---|---|---|
| **prompts.chat** (f/awesome-chatgpt-prompts) | **VERY ALIVE** | Free OSS library, **~164k GitHub stars**, 7,000+ commits. The reason paid marketplaces face commodity pressure [H]. | [GitHub](https://github.com/f/awesome-chatgpt-prompts) |
| **PromptBase** | **ALIVE, niche** | 80/20 marketplace, 270k+ prompts; **~809k monthly visits (May 2026, +49.8% MoM)** but sub-1M, squeezed by free libraries + better models. Now also a hire/freelance marketplace [M]. | [Similarweb](https://www.similarweb.com/website/promptbase.com/), [promptbase.com/sell](https://promptbase.com/sell) |
| **FlowGPT** | **ZOMBIE-leaning** | $10M pre-A (2024). Traffic volatile (~2.4–3.8M, conflicting); reputation skews to NSFW/jailbreak/"DAN" content — not a credible "team context" peer [L-M traffic, H reputation]. | [Semrush](https://www.semrush.com/website/flowgpt.com/overview/), [arXiv 2408.00512](https://arxiv.org/html/2408.00512v1) |
| **AIPRM** | **DECLINING** | ~1M users but **documented backlash** (no-refund, auto-renewal, price hikes, UI clutter); core use cannibalized by native ChatGPT custom instructions/GPTs. The cautionary over-monetization tale [M]. | [Trustpilot](https://www.trustpilot.com/review/www.aiprm.com), [AIPRM forum](https://forum.aiprm.com/t/price-increase/70413) |
| **Snack Prompt** | **ALIVE, yellow flag** | Being acquired by **Spectral Capital (OTCQB penny-stock shell)** for stock + earn-out, Oct 2025; **pivoting from "prompt marketplace" → "SMB workflow automations."** Signals weak standalone monetization [H facts, M interpretation]. | [PRNewswire](https://www.prnewswire.com/news-releases/spectral-capital-executes-binding-term-sheet-to-acquire-snack-prompt-302576802.html), [SEC 8-K](https://www.sec.gov/Archives/edgar/data/0001131903/000109690625001655/fccn-20251003_8k.htm) |

**Lesson:** The *free, open* library is the durable form; *selling individual prompts* is a dying
model. The public Atrium should be free-to-browse; monetization (if ever) should not be per-asset
sales.

### 1C. Per-tool registries & directories — owned, crowded, but siloed

- **cursor.directory** — Created by Pontus Abrahamsson (Aug 2024); repo now lives under the
  **`cursor/` GitHub org** (`cursor/community-plugins`, ~4k stars), suggesting Anysphere
  stewardship (no formal acquisition announcement found [M]). Auto-detects rules, MCP, Skills,
  Agents, Hooks. ~68k+ community [M]. [cursor.directory](https://cursor.directory/),
  [GitHub](https://github.com/pontusab/directories)
- **Claude Code skills** — Anthropic's official `anthropics/skills` repo (**149k stars, verified
  live** [H]); Agent Skills published as an open cross-platform standard ~Dec 2025 [M]; official
  Claude Code **plugin marketplace** (~55 curated plugins) plus large third-party marketplaces
  [M]. [anthropics/skills](https://github.com/anthropics/skills),
  [Anthropic engineering](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)
- **MCP registries** — **Official registry** (registry.modelcontextprotocol.io) launched preview
  2025-09-08, ~2,000 entries by Nov 2025 [H]. Third-party counts diverge wildly and overlap:
  **Glama ~34.6k** (live), mcp.so ~19.7k, PulseMCP ~12–16k, **Smithery ~6–7k** (Mao/Kamath, VC-
  backed). De-duplicated, the *real* ecosystem is ~9.4k distinct servers [L-M].
  [MCP blog](https://blog.modelcontextprotocol.io/posts/2025-09-08-mcp-registry-preview/),
  [Glama](https://glama.ai/mcp/servers)
- **GPT Store** — 3M+ GPTs created (cumulative, Jan 2024); only **~159k publicly listed** [L
  estimate]; revenue-sharing opaque/US-only, most creators earn nothing; **eclipsed by the Apps
  SDK / App Directory (Dec 2025)** [H]. [OpenAI](https://openai.com/index/introducing-the-gpt-store/),
  [Apps in ChatGPT](https://openai.com/index/introducing-apps-in-chatgpt/)
- **Poe** — Clearest *active* creator monetization: price-per-message + subscription rev-share,
  **US-only** [H]. [Poe/Quora](https://quorablog.quora.com/Introducing-creator-monetization-for-Poe)

**Read:** Each registry owns *one tool's* artifacts. The whitespace is *cross-tool*, not out-
registering any single one.

### 1D. Creator-side galleries — they tie prompt→result (the model for the Atrium)

- **Civitai** — On-site image/video generation + LoRA trainer; **image posts display prompt +
  generation parameters** (strong reproducibility). But severely constrained: **lost credit-card
  processing 2025-05-23** over nonconsensual content, now crypto/gift-code dependent; a **Jan 2026
  MIT Tech Review investigation** documented deepfake-bounty abuse [H]. A cautionary tale on UGC
  moderation. [Civitai education](https://education.civitai.com/using-civitai-the-on-site-image-generator/),
  [MIT Tech Review](https://www.technologyreview.com/2026/01/30/1131945/inside-the-marketplace-powering-bespoke-ai-deepfakes-of-real-women/)
- **OpenArt** — Strongest reproducibility: full "recipe" (prompt, model, negative prompt, sampler,
  CFG, steps, seed) + **"Remix" button** [M-H]. [review](https://ec-arts.com/openart-ai-review-prompt-gallery-filters/)
- **Midjourney Explore** — Shows prompts; seed param gives ~99% (not bit-exact) reproducibility in
  V8.1 [M-H]. [MJ docs](https://docs.midjourney.com/hc/en-us/articles/32604356340877-Seeds)
- **Prompt Hunt** — Technically online but **lost prominence**; absent from 2025–26 marketplace
  comparisons; current functionality unverified (403 on fetch) [L]. A zombie.

**Key insight:** The image galleries *prove the results-attached model works* and set the
reproducibility bar (show the exact recipe + a re-run button). **No code-side tool — none of the
rules-sync CLIs — does this.** It is the most transferable, most defensible idea.

### 1E. Generic tools people actually use instead

The real incumbent is **"good-enough general productivity tools"** [H]:

- **Notion** (#1) — large ecosystem of "AI Prompt Database" templates; the default "prompts hub"
  [H]. [Notion templates](https://www.notion.com/templates/ai-prompts-database)
- **GitHub gists / awesome-lists** — public sharing mechanism; prompts.chat is the flagship [H].
- **Obsidian** vaults (+ "Vault Prompt" plugin) [M]; **Raycast** snippets/PromptLab (Mac power-
  users, <20 prompts) [H]; **TextExpander** (abbreviations + an MCP server into Claude/ChatGPT;
  Amwell case: 4,445 hrs/yr saved) [H].
  [Raycast PromptLab](https://www.raycast.com/HelloImSteven/promptlab),
  [TextExpander AI](https://textexpander.com/ai-prompts)

**Shared weakness (the opening):** all are **siloed storage with no point-of-use insertion, no
variables/versioning, and — critically — no sync into coding-agent config files** [M].

---

## 2. The Gap Check *(most important)*

**Verdict: the sync mechanic is crowded, the registry is well-funded, but the *full combined
product* is only partially occupied.** Name-by-name:

### The converter/sync layer (CROWDED — do not differentiate here)

- **`dyoshikawa/rulesync`** — dominant, **~1,150 stars**, v8.28.0 **released 2026-06-11**
  (research day); 20+ tools; MCP/skills/commands; thin `fetch` from repos but **no hosted gallery,
  no private cloud** [H]. [GitHub](https://github.com/dyoshikawa/rulesync)
- **`intellectronica/ruler`** — most-starred pure converter (**~2.7k stars**), 30+ agents,
  propagates MCP via `ruler.toml`; local-only, no registry [H].
- **`block/ai-rules`** — maintained by **Block (Square/Cash App)**, Rust, 11 agents, generates MCP
  configs; local-only [H].
- **`Goldziher/ai-rulez`** — ships a **built-in rule library** + built-in MCP server (35+ tools) +
  "Remote Includes" to share across repos; still local-generation [H].
- **`agent_sync`**, **`agentsmesh`** — smaller, same shape [H/M].

> None bundle hosted public gallery + private cloud + sync. They are *only* the convert piece [H].

### The AGENTS.md standard (commoditizes conversion further)

- Launched ~Aug 2025; **used by 60k+ repos** by mid-2026 (self-reported via GitHub code-search;
  the earlier ~20k figure is firmer) [M/H]. Now stewarded by the **Agentic AI Foundation (Linux
  Foundation)**, co-founded by **OpenAI with Anthropic and Block** — *not* a sole-OpenAI product
  [H]. 25+ tools read it [H]. [agents.md](https://agents.md),
  [Agentic AI Foundation](https://openai.com/index/agentic-ai-foundation)
- **Implication:** as AGENTS.md converges as the de-facto format, the value of pure format-
  conversion *declines* — differentiation moves to library/curation/distribution [M].
- Corroborating user pain (single-source-of-truth): a dev blog documents unifying `.cursorrules`
  and `CLAUDE.md` into one `.ai/` directory via symlinks [M].
  [keboca.com](https://www.keboca.com/articles/cursorrules-ai-how-i-unified-my-cursor-and-claude-config-one-place)

### The public-registry/marketplace layer (well-CAPITALIZED — don't fight head-on)

- **Tessl (tessl.io)** — "the package manager for agent skills and context": public **registry of
  2,000+ evaluated skills** + private/org workspaces + distribution to Claude Code/Cursor/Copilot/
  Gemini. **Raised $125M** ($25M seed boldstart/GV + **$100M Series A led by Index**, Accel); Snyk
  security partnership [H]. **The best-funded direct-adjacent.**
  [Tessl Series A](https://tessl.io/blog/announcing-our-series-a-for-ai-native-software-development/),
  [registry](https://tessl.io/registry)
- **Skills.sh (vercel-labs/skills)** — Vercel-backed "npm for skills," `npx skills add owner/repo`,
  leaderboard indexes 600k+ skills; skills-only, no private storage [M]. [skills.sh](https://skills.sh)
- **~8 skill marketplaces by Q2 2026** (Skills.sh, SkillsMP, ClaudeSkills.info, Smithery, TokRepo,
  claudemarketplaces.com, Anthropic's own) — the "public gallery of skills" niche is **saturated**
  [H].
- **Cursor rules galleries already ship**: cursor.directory, PatrickJS/awesome-cursorrules,
  dotcursorrules.dev (discover/share/**upvote**) [H].

### The closest "all-three-pieces" matches (the real competitors)

- **PromptHub (prompthub.click)** — **the tightest functional match.** AGPL OSS; combines (1)
  curated **public skill library**, (2) **private local-first AES-256 storage** ("your prompts
  should never become training data"), (3) **one-click distribution to 15+ tools** (Claude Code,
  Cursor, Windsurf), plus versioning + multi-model testing. **But:** prompt/skill-centric (not
  rules-centric), **no results-attached gallery, no skill-level tiering** [H, verified directly].
  [prompthub.click](https://prompthub.click)
- **ctrl+shft (ctrlshft.dev)** — OSS "dotfiles for AI agents" with the public/private/sync triad
  via git, but Claude-Code-centric, no hosted gallery, no tiering [H].
- **Snippets AI (getsnippets.ai)** — commercial; public+private libraries + "Share & Earn" creator
  gallery + version control, but inserts into *any app*, **not native editor-rule sync** [M].
- **Packmind** — commercial "**enterprise ContextOps**" (build→distribute→govern→drift-detect
  across 8 tools); **no public community gallery**, enterprise-only [H].

### Direct gap assessment

- **No product named "PromptAtrium" exists publicly** — confirms it's pre-launch, not a competitor
  [H, negative].
- **No found tool organizes assets by user skill level (beginner→expert)** as a first-class axis
  [M, *un-provable negative — could exist in stealth*].
- The **triad** (public + private + sync) is **occupied** by ≥2 credible players (PromptHub, Tessl)
  [H]. The genuinely whitespace combination is the **full stack at once**: hosted results-attached
  gallery + private stash + multi-editor MCP/CLI sync + skill-level tiering + **all artifact types
  (prompts AND skills AND rules AND workflows)**. Each competitor omits ≥1 axis [M].
- **Strategic caveat:** sync is being commoditized (AGENTS.md) and the registry is being captured
  by capital (Tessl/Vercel) and incumbents (Anthropic/Cursor). **Defensibility must rest on
  curation/UX/results — not on sync mechanics, which are table stakes** [M].

---

## 3. Density Lessons

### What got UGC products to density *before* network effects

A consistent pattern: **density was always manufactured, never waited for.**

- **Civitai** — *imported an existing corpus*: launched with ~50 models ("all that had been made
  for the last three months"), scaled to ~500/day within a year; added a **free on-site generator
  (Sept 2023)** as single-player utility, plus "Buzz" credits to engineer contribution [H].
  [latestly.ai](https://www.latestly.ai/p/how-civitai-built-the-largest-community-for-custom-ai-models-and-art),
  [TechCrunch](https://techcrunch.com/2023/11/14/andreessen-horowitz-backs-civitai-a-generative-ai-content-marketplace-with-millions-of-users/)
- **PromptBase** — founder solved **his own** need first; reached ~11k users in month one with
  **2× more buyers than sellers** (demand-led); niche-first (GPT-3 → images) [M-H].
  [Fast Company](https://www.fastcompany.com/90825418/promptbase-generative-ai-prompt-marketplace)
- **GitHub/Gist** — **single-player utility before social**: a gist/repo is useful *solo*;
  forking/starring/comments layered on top [M].
- **Product Hunt** — hand-seeded: **30 hand-picked contributors**, ~170-subscriber email list,
  **founder's borrowed network** from years of blogging; Hoover personally welcomed early members
  [H]. [Ryan Hoover](https://www.ryanhoover.me/post/product-hunt-began-as-an-email-list)
- **Pinterest** — **manual founder seeding**: Silbermann emailed his whole address book, gave early
  users his cell number, did offline meet-ups; later said growth was **"marketing, not
  engineering"** [H/M lore]. [AllThingsD](https://allthingsd.com/20121020/the-secret-behind-pinterests-growth-was-marketing-not-engineering-says-ceo-ben-silbermann/)
- **Are.na** — **deliberately anti-viral**, member-funded, small-team curation; proves density can
  be quality-led [H]. [Wikipedia](https://en.wikipedia.org/wiki/Are.na)
- **Andrew Chen's "Cold Start Problem"** — build a dense **"atomic network"** via manual/invite
  effort; Reddit founders manually seeded fake early posts [H].
  [andrewchen.com](https://andrewchen.com/how-to-solve-the-cold-start-problem-for-social-products/)

**→ For PromptAtrium:** the **Stash must be useful with zero other users** (single-player utility),
and *you* seed the Atrium with your own results-attached assets + import existing corpora
(prompts.chat, awesome-lists). Niche-first beats broad.

### Why prompt-sharing sites failed (3+ post-mortems)

1. **Non-defensibility** — *"your prompts are not secret."* Nikolay Stankov (2024) demonstrated
   prompt-extraction via injection against GPTs/plugins [H, opinion].
   [Medium](https://medium.com/@me_75537/congrats-on-the-marketplace-i-know-your-prompts-and-you-cant-defend-it-dbaecc6cfa79)
2. **Depreciation** — models improve and absorb public prompt tricks; **Gartner** now publishes
   "Context engineering: Why it's Replacing Prompt Engineering for Enterprise AI Success" [M/H].
   [Gartner](https://www.gartner.com/en/articles/context-engineering)
3. **Signal-to-noise collapse** — AI-generated spam flooding; **PromptBase itself** added policy
   against "low-effort, mass-generated" prompts; a reviewer found ~8 useful prompts in 3 hrs on
   FlowGPT [H/M]. [PromptBase guidelines](https://promptbase.com/prompt-guidelines)
4. **Marketplace economics** — buying prompts one-by-one is *"like buying songs on iTunes when
   Spotify exists"* [M, opinion]. Dead/exited examples: **Promptrr.io** (suspended),
   **PromptPerfect** (shutting down Sept 2026), **PromptHero** (acquired, not standalone-
   successful), **PromptSea** (pivoted off NFT model) [M].

**→ The three structural killers — non-defensibility, depreciation, spam — all argue for the
*gallery-with-attached-results* model** (a result is hard to fake/spam and stays valuable even as
the prompt ages) and against *selling* prompts.

---

## 4. Demand Signals

**The pain is real, has hard signal, and has a vocabulary.**

- **"Context engineering"** was crystallized **June 2025 by Karpathy + Shopify's Tobi Lütke** on X
  and spread to LangChain/Anthropic/LlamaIndex within weeks [H]. The **breakout SEO term.**
  [Karpathy](https://x.com/karpathy/status/1937902205765607626),
  [Simon Willison](https://simonwillison.net/2025/Jun/27/context-engineering/)
- **HN: "AGENTS.md – Open format for guiding coding agents" → 837 points / 382 comments** [H] — the
  single hardest engagement signal; commenters complain of root-dir "pollution," "cruft," hidden-
  file sprawl. [HN](https://news.ycombinator.com/item?id=44957443)
- **The canonical pain:** by mid-2025 a serious repo needed **~5 near-identical config files**
  (.cursorrules, CLAUDE.md, copilot-instructions.md, AGENTS.md, CONVENTIONS.md) [H].
  [morphllm](https://www.morphllm.com/agents-md-guide)
- **AGENTS.md adoption grew ~20k → ~60k repos** in under a year — demand-growth signal [M].
- **"AI agent sprawl"** is now an **IBM enterprise-governance term**: "each system maintains its
  own version of the truth" [H]. [IBM](https://www.ibm.com/think/topics/ai-agent-sprawl)
- **2026 State of Context Management Report:** 82% of IT/data leaders say prompt engineering alone
  is no longer sufficient; 95% of data teams plan to invest in context-engineering training in 2026
  (secondary-cited) [M]. [Gartner](https://www.gartner.com/en/articles/context-engineering)
- **prompts.chat ~143k → ~164k stars** across 2025–26 — sustained demand to collect/store prompts
  [H]. [GitHub](https://github.com/f/awesome-chatgpt-prompts)
- **Job market:** "Prompt Engineer" *title* declining ~30–40% while prompt skills absorbed into "AI
  Engineer" roles (secondary, %s unverified) [L-M].
- **Counter-signal (flag):** value is *contested* — some HN threads cite research showing only ~4%
  improvement from an AGENTS.md file; "the pain is real but 'just add a markdown file' is debated"
  [M]. [HN](https://news.ycombinator.com/item?id=47938417)

**Vocabulary for naming/SEO (ranked):**

1. **"context engineering"** (breakout term)
2. **"single source of truth"** (desired end-state)
3. **"prompt sprawl" / "AI agent sprawl"**
4. **"scattered," "siloed," "rebuilding from scratch"**
5. **"prompt drift"**

**Avoid "working set"** — searched, **not in the vernacular** [M].

> *Low-confidence flags / open evidence gaps:* quantified **Google Trends** curves could not be
> pulled by the research tooling; **primary Reddit threads** were under-indexed by search (pain
> corroborated via aggregator/vendor/blog content rather than primary threads). Recommend pulling
> Google Trends and Reddit (via the site or its API) directly before finalizing naming.

---

## 5. Positioning Recommendation

### The sharpest wedge (zero-budget solo)

**Be the daily-use "AI working set" home for the *under-served ends of the skill curve* —
beginners and content-creators — with results-attached proof.** Every funded competitor (Tessl
$125M, Packmind, the dotfiles crowd, the rules-sync CLIs) is aimed at **professional developers**.
That's where the capital and incumbents already are. Two of the three target segments — **office
workers told to use Copilot** and **content creators** — are served well by **no serious
competitor.** Lead there.

Concretely: a **single-player Stash** that is genuinely useful before anyone else shows up (the #1
cold-start lesson), with the **Atrium gallery seeded by the founder** (results-attached), and
**sync as a quiet utility, not the headline.**

### What NOT to build (incumbents own it)

- **Don't build the sync/convert engine as a differentiator** — `rulesync`/`ruler`/Block/`ai-rulez`
  give it away; AGENTS.md is commoditizing format conversion [H]. *Wrap* an existing one or
  implement minimally; never market it as the point.
- **Don't try to be the skills registry** — Tessl ($125M) + Vercel Skills.sh + Anthropic + Smithery
  own it [H].
- **Don't be the per-tool directory** — cursor.directory owns Cursor rules; the MCP registries own
  MCP [H].
- **Don't sell individual prompts** — three post-mortems say the model is dead; prompts.chat (free)
  wins [H].
- **Don't go enterprise-governance** — Packmind owns "ContextOps" and a solo project can't out-
  resource it [M].

### The 3 most defensible differentiators

1. **Results-attached reproducibility.** Tie every public asset to its *output* (the Civitai/
   OpenArt model: show the recipe + a re-run), which **no code-side rules/skills tool does**, and
   which structurally defeats the spam + depreciation killers from §3. **The strongest, most
   transferable idea.**
2. **Cross-skill-level curation & onboarding.** The genuinely unoccupied axis [M] — a beginner-to-
   pro ladder (office worker → creator → developer) that incumbents, all pro-dev-focused, ignore.
   Also the best content/SEO surface around "context engineering for beginners."
3. **One home for *all* artifact types.** Prompts **and** skills **and** rules **and** workflows in
   one stash — versus PromptHub (skill/prompt-only), Skills.sh (skills-only), the rules-sync CLIs
   (rules-only). Be the *generalist* private home (the "Google Keep for AI context") that none of
   the specialists are.

---

## Methodology & confidence notes

Findings come from five parallel research sweeps (≈90 sourced claims), with the most load-bearing
claims independently re-verified (anthropics/skills star count, Langfuse→ClickHouse, Tessl $125M,
PromptHub feature set). **Lowest-confidence items, explicitly flagged:** (a) all "nobody does X"
negatives in §2 are absence-of-evidence, not proof; (b) MCP registry counts diverge across sources;
(c) Google Trends and primary Reddit threads were not directly accessible — recommended as the next
manual checks; (d) several traffic/job-market percentages are secondary estimates. Where a
competitor could exist in stealth, assume the whitespace is narrower than it looks and **compete on
execution/UX/curation, not on a claim of being first.**

### The competitive set (names to remember)

- **Converters/sync:** rulesync (dyoshikawa), Ruler (intellectronica), ai-rules (Block), ai-rulez
  (Goldziher), agent_sync, agentsmesh
- **Registries/galleries:** Tessl, Skills.sh (Vercel), cursor.directory, Smithery, Glama, PulseMCP,
  VoltAgent/awesome-agent-skills, awesome-cursorrules
- **Closest combined competitors:** PromptHub (prompthub.click), ctrl+shft, Snippets AI, Packmind,
  Tessl
- **Prompt-ops (adjacent):** PromptLayer, Langfuse, Helicone, Vellum
- **Consumer marketplaces (commoditized):** prompts.chat, PromptBase, FlowGPT, AIPRM, Snack Prompt
- **Creator galleries (results model):** Civitai, OpenArt, Midjourney, Prompt Hunt
