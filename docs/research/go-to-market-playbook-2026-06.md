# PromptAtrium — Go-To-Market Distribution Playbook

**Solo founder · zero budget · no audience · target = Claude Code / Cursor power users**
· Compiled 2026-06-12 · Current as of mid-2026

> **Confidence legend:** **[H]** high (primary source / direct API read), **[M]** medium
> (secondary/corroborated), **[L]** low (single source, estimate, or inference).
> Star counts marked [H] were read live from the GitHub API on 2026-06-12. Traffic figures
> from Similarweb/Semrush are estimates and marked [M] at best.

---

## TL;DR — the one-paragraph strategy

For *this specific product* the highest-leverage path is **not** a launch — it's **artifacts +
registries**. The dominant spreading unit in the AI-coding niche is a free, drop-in, single-file
artifact (a curated rules/skills collection) published as a GitHub **awesome-list**, plus an
**open-sourced MCP server** syndicated across the MCP registries. Those two assets compound for
months, rank in search, and feed every major AI client at once. Launches (Show HN, Product Hunt,
Reddit) are *spikes* that validate curiosity but rarely retain users — sequence them *after* the
assets exist so the spike lands on something with social proof. Treat Product Hunt as a backlink,
not a growth engine. Budget your scarce 5 hrs/week on the compounding assets first.

---

## Part 1 — Watering holes, ranked by (reach × receptiveness)

Ranked for a *brand-new tool from an unknown founder*. Reach without receptiveness is a trap.

### Tier 1 — Build here first (receptive + real reach)

| Venue | Size | Receptiveness & norms |
|---|---|---|
| **GitHub awesome-lists** (the channel, not a venue) | Top lists hold 40K–89K stars **[H]** | The single biggest spreading format in this niche (see Part 2). Self-submission PRs are often *rejected*; third-party submission accepted **[M]**. |
| **MCP registries** (Glama, PulseMCP, mcp.so, Smithery, official) | Glama ~34.5K servers, mcp.so ~19.7K, PulseMCP ~18K, official ~9.6K **[M]**; ecosystem ~97M SDK downloads/mo **[M]** | One open-sourced server syndicates across all 5 and reaches every major client (Claude, Cursor, Copilot, VS Code, Zed) **[H]**. Submission is the norm, not spam. |
| **r/SideProject** | ~628K–735K (sources disagree) **[M]** | *Explicitly* self-promo friendly if you tell a story (what/why/stack/feedback-ask). One post per 3–4 weeks; **must reply to commenters** or risk removal **[H]**. |
| **r/vibecoding** | ~279K, fastest-growing dev sub **[M]** | Rules still forming; "genuine builds" welcome → low friction for an unknown **[M]**. |
| **Cursor official Discord** | ~37K members **[H]** | Stated purpose includes "Showcase your new projects" — a sanctioned showcase channel **[H]**. |
| **Show HN** | HN ~15M visits/mo **[M]** | Front-page *placement* (not upvote count) drives 5K–30K visitors/24h **[M]**. Neutral title, technical depth, free artifact as CTA. See the cursor.directory dissection in Part 2. |
| **r/ClaudeAI / r/cursor** | ~915K **[H]** / ~140K **[M]** | Huge and on-topic, but stricter on overt promo — lead with a free artifact or genuine build, not a pitch. |

### Tier 2 — Editorial gatekeepers (high reach, need *their* pickup; can't self-post)

| Venue | Size | Notes |
|---|---|---|
| **Latent Space** (swyx) | 200K+ subs / 10M+ reach; AINews ~80K **[H]** | **Best fit** — explicitly covers new AI-coding tools (Cursor, Windsurf, Cody, Bolt) **[H]**. Pitch the free-artifact angle. |
| **dev.to** | 3M+ devs (acquired by MLH Feb 2026) **[H]** | Write a genuinely technical post (architecture, "how I keep CLAUDE.md in sync"); organic reach is editorial + SEO, not viral. |
| **The Pragmatic Engineer** | ~1.1M subs **[H]** | Enormous but hard to crack as an unknown; aspirational, not a week-1 plan. |

### Tier 3 — Hostile / restricted (know the rules before you waste a post)

| Venue | Why to avoid (for now) |
|---|---|
| **r/programming** (~6.9M) | **Banned all AI/LLM content** starting ~April 2026 (announced as a 2–4 week trial; watch whether it lapsed) **[H]**. Hostile territory for an agentic-coding tool. |
| **r/SaaS** | Self-promo confined to weekly threads only **[M]**. |
| **Product Hunt** | Not a community you join; a one-shot launch with declining ROI (Part 3). |

---

## Part 2 — Formats that spread (5 dissected examples)

The spreadable unit in this niche is a **repo (stars)**, a **directory launch (page views)**, or a
**"my setup" thread** — *not*, as far as the evidence shows, demo GIFs/videos (no AI-coding GIF with
a verifiable view count surfaced). Star counts below are live GitHub API reads, 2026-06-12.

1. **`punkpeye/awesome-mcp-servers` — ~88.9K stars [H].** Created 2024-11-30, *days* after Anthropic
   announced MCP. **Why it worked:** first-mover on a brand-new primitive + a zero-friction index.
   The #2 competing list has ~5.6K stars — a **16×** gap. *Lesson: being canonical/first on a new
   primitive is worth more than quality-of-content.*

2. **`cursor.directory` Show HN — 51 points but 364K page views + 1K stars in a weekend [H/M].** The
   HN post itself was *modest* (51 points, 20 comments, verified on HN Algolia) **[H]**, yet front-page
   placement drove a founder-claimed 364K page views; a v1 relaunch a week later did another 80K **[M,
   first-party]**. **Why:** free useful artifact + directory + *repeatable* relaunches (v1, framework
   rules, Raycast/MCP integrations). *Lesson: optimize for placement & a free artifact, not the vanity
   upvote number — and a directory can re-launch for repeat spikes.*

3. **`VoltAgent/awesome-design-md` — ~89.5K stars in ~10 weeks [H].** Created 2026-03-31. **Why:**
   (a) value visible in one before/after **screenshot** (generic UI → branded UI), maximally
   shareable; (b) a **drop-in single file**; (c) **publisher flywheel** — VoltAgent runs 6+ lists
   each >5K stars feeding their framework repo, so each new list launches into an existing audience.
   *Lesson: screenshot-able value + drop-in file + a portfolio of lists compounds.*

4. **`PatrickJS/awesome-cursorrules` — ~40K stars [H].** The canonical free `.cursorrules` collection
   (loss-leader). The #2 clone has ~199 stars — a **~200× gap**. *Lesson: winner-take-most; clones
   barely register, so be early and own the canonical slot.*

5. **"Show your setup" / "my CLAUDE.md" — a reliable few-hundred-to-few-thousand-star genre [H].**
   Boris Cherny's (Claude Code creator) "my setup" X thread spawned a dedicated mirror repo;
   `centminmod/my-claude-code-setup` hit ~2.4K stars as one dev's personal config; a micro-genre
   (`josix/awesome-claude-md` 362, `abhishekray07/claude-md-templates` 250, etc.) clears hundreds of
   stars even for unknown authors. *Lesson: "post your CLAUDE.md/working set" is a dependable format
   even with no audience — and it's exactly what PromptAtrium hosts.*

**Cross-cutting pattern:** every winner is **zero-friction and drop-in** (`.cursorrules`, `CLAUDE.md`,
`.mdc`, skill `.md`) — copy one plain-text file, no install, no API key. New-Anthropic-feature →
awesome-list land-grab within ~2 weeks is a repeatable timing signal (MCP Nov 2024; Skills Oct 2025).

---

## Part 3 — Post-mortems: what comparable founders credit vs. call wasted

**What's credited as the growth lever:**

- **Marketplace/directory keyword SEO.** Sixth grew a VS Code extension from ~100 installs (2 months)
  to **270 installs/day → 30K total** purely by renaming it with a keyword-stuffed title; once
  rankings stuck on download history they could revert the name **[H, founder blog, verified]**.
  *Direct read-across: PromptAtrium's public asset pages need keyword-optimized titles per asset.*
- **Organic content as distribution.** SuperX hit **$23K MRR in 6 months, 95% organic on ~$5K ad
  spend**; switching from text to **daily video = "10× reach"** and 30% trial→paid from his organic
  audience. His prior **5 products earned $0** — he blames absent distribution, not bad product
  ("nobody knew they existed") **[H, IH interview]**.
- **A free dataset/artifact as the CTA.** Aidlab's Show HN front-page (~6K page views, 468 launch-day
  users) converted **zero** direct sales — but offering **free datasets** was the CTA that actually
  drove engagement **[H, founder postmortem]**.
- **In-house platform community.** Raycast seeded first users via its **Slack community** and grew to
  1,500+ extensions partly by choosing a familiar React/TS stack **[H, Raycast blog]**.

**What's explicitly called wasted:**

- **Product Hunt for revenue.** BrandingStudio: **400 signups, 168 upvotes, #3 → 1 paying customer,
  $237** (0.25%); founder calls PH traffic "curious, not buyers" and names **$140 LinkedIn ads** as
  wasted spend **[H, verified verbatim]**. A 387-launch study found Indie Hackers posts convert at
  ~23% vs Product Hunt's ~3%, and 89% of PH founders surveyed wouldn't launch again **[M]**.
- **Paid ads broadly.** Across multiple IH interviews, founders independently name organic
  SEO/content/X as the driver and report paid ads/cold email as underperforming **[M]**.

**The consistent shape:** launches produce **signup/traffic spikes, near-zero immediate paid
conversion, and weak retention**; durable growth is credited to **compounding organic assets**
(marketplace SEO, content, community, ecosystem placement).

---

## Part 4 — Tactics that USED to work but are now saturated or penalized

- **Product Hunt launches.** Featured slots cut ~66% (≈47/day Sept 2023 → ≈16/day Sept 2024); only
  ~10% of launches get featured; ~91% of launched SaaS have <100 active users; front-page vote-buying
  is solicited openly **[M]**. *Still worth a badge/backlink, not a growth bet.*
- **Pure Reddit self-promo.** 73% of a 500-post banned sample were removed for **promo language in
  the first two sentences**; site-wide **shadowbans** are common enough to have spawned a checker-tool
  industry; subs gate on account-age/karma **[M]**. *You must comment first and lead with value.*
- **SEO for small sites.** Google's **Sept 2023 Helpful Content Update** wiped >90% of organic traffic
  from 32% of studied independent publishers and was **folded permanently into core ranking** (March
  2024) with **no notable recoveries** **[H]**. **AI Overviews** cut the #1 result's CTR ~58% (Ahrefs,
  300K-keyword study, Dec 2025) and pushed zero-click to ~69% **[H]**. *SEO still works as a slow
  long-tail compounder for directory pages — cursor.directory and the awesome-list repos do rank — but
  it's 3–6 months to traction and risky as a sole channel.*
- **Show HN.** Only ~10% of stories reach the front page; median Show HN scores **2 points**; a
  data study found **2022 was peak and 2025 the worst year** for traction (volume ~tripled) **[M]**.
  *Placement is harder than it was — but still the best single free traffic spike available.*
- **X organic.** Since **March 2025**, link posts from **non-Premium** accounts have ~0% median
  engagement (link suppression); Premium gets ~10× reach **[M]**. *Build-in-public on X now requires
  Premium and a content treadmill.*
- **Cold email / DM.** Response rates ~3.4% (2026); Gmail/Yahoo (Feb 2024) + Microsoft (May 2025)
  sender-auth rules make spray-and-pray cold outreach a dead end **[H]**.

---

## Part 5 — The 90-day sequence (≈5 hrs/week)

**Principle:** spend the first month building *assets that compound*, not chasing an audience. Launch
spikes land later, on top of social proof.

### Weeks 1–4 — Build the compounding assets (don't launch yet)

1. **Open-source the MCP server** and submit it to all 5 registries (Glama, PulseMCP, mcp.so,
   Smithery, official MCP registry) — one-time syndication, reaches every client. *(~2 hrs once.)*
2. **Publish a free loss-leader artifact**: a genuinely great curated public collection (rules /
   skills / slash-commands) as its own repo. Make it **drop-in, single-file, zero-install**.
3. **Get listed on existing awesome-lists** (`awesome-claude-code`, `awesome-cursorrules`,
   `awesome-mcp-servers`) — but have **an early user submit the PR**, since self-submissions are
   often rejected. Consider creating your *own* canonical list for a sub-niche nobody owns yet.
4. **Stand up SEO-able public asset pages** now (programmatic, one indexable page per asset,
   **keyword-optimized titles** per the Sixth lesson). They take 4–8 weeks to index — start the clock.
5. **Start build-in-public on X** (Premium, for link reach) and draft 1–2 technical dev.to posts.

**Measure:** repo stars (1K is the credibility gate that ~doubles downstream conversion), registry
installs, awesome-list inclusions, first indexed asset pages.

### Weeks 5–8 — Sequence the launches (spike onto the assets)

- **Wk 5 — Soft launch** in Cursor Discord showcase + r/vibecoding + r/SideProject (story format,
  reply to every comment). Lead with the *free artifact*, mention the product second.
- **Wk 6 — Show HN.** Neutral title, technical-depth writeup, free artifact as the CTA. Post Tue–Thu
  morning ET. Aim for *front-page placement*, not upvotes.
- **Wk 7 — Pitch Latent Space / AINews** (they cover new AI-coding tools). Angle: the free public
  collection + the "keep your working set in sync" pain.
- **Wk 8 — Product Hunt** as a *badge/backlink + IndieHackers journey post*, with zero revenue
  expectation. Repurpose the same narrative into an IH post (which converts ~7× better than PH).

**Measure:** front-page placement achieved (y/n), referral signups *by source*, which venue actually
sent activated users.

### Weeks 9–12 — Compound the loop

- **UGC flywheel:** prompt users to publish their own "working set" / CLAUDE.md (the genre that
  reliably earns stars) — each public set is an SEO page + social proof.
- **Relaunch cadence:** ship visible additions (new collections, an integration) and re-post — the
  cursor.directory repeatable-relaunch model.
- **Short video demos** weekly on X (the SuperX 10× lesson).
- **Double down** on whichever Wk 5–8 source produced *retained* users; cut the rest.

**Measure (the metric that matters):** **D7 / D30 retention** of signups (launches inflate signups;
retention is truth) and a north-star of **weekly active asset-syncers**.

---

## Confidence & caveats

- **Strongest evidence (dated, primary):** GitHub star counts (live API); Sept 2023 HCU + March 2024
  core update (Google docs); Ahrefs 300K-keyword AI-Overview CTR study; cursor.directory Show HN
  (verified on HN Algolia); BrandingStudio & Sixth founder postmortems (verified verbatim).
- **Weaker / single-source (treat as directional):** Product Hunt decline figures (SEO-blog
  aggregations + HN anecdotes); Reddit shadowban prevalence; `everything-claude-code` ~163K stars and
  OpenCode ~167K (third-party blogs, could not API-verify); directory traffic estimates (Similarweb).
- **Time-sensitive:** the r/programming AI ban was announced as a **2–4 week trial in April 2026** —
  re-check whether it became permanent before writing it off. Reddit subscriber counts from
  third-party aggregators disagreed by up to ~100K; spot-check live sidebars before acting.

---

## Source appendix

**Watering holes:** redditli.st & gummysearch (subreddit sizes); Tom's Hardware + HN #47610336
(r/programming AI ban); mediafa.st & redditmaster (r/SideProject rules); discord.com/servers/cursor;
latent.space/about; newsletter.pragmaticengineer.com/p/one-million; dev.to/about + MLH acquisition;
flowjam.com & markepear.dev & lucasfcosta.com (HN norms).

**Formats:** github.com/{punkpeye/awesome-mcp-servers, VoltAgent/awesome-design-md,
PatrickJS/awesome-cursorrules, hesreallyhim/awesome-claude-code, centminmod/my-claude-code-setup};
news.ycombinator.com/item?id=41346156 + x.com/pontusab/status/1830284322794045556 (cursor.directory).

**Post-mortems:** indiehackers.com posts (Aidlab HN postmortem; BrandingStudio 400-signups;
SuperX $23k MRR); blog.trysixth.com (30k installs); raycast.com/blog; newsroom.haas.berkeley.edu
(FlowGPT); extensionpay.com (Chrome ext revenue).

**Saturated tactics:** gsqi.com & amsive.com (HCU/core updates); ahrefs.com/blog/ai-overviews;
searchenginejournal.com (Pew zero-click); blog.sturdystatistics.com (State of Show HN);
hashmeta.com (X 2025 algorithm); awesome-directories.com & mysignature.io (Product Hunt decline);
indiehackers.com + reddifier.com (Reddit shadowbans); scaledmail.com (sender rules).

**MCP/SEO mechanics:** blog.modelcontextprotocol.io (registry preview); glama.ai/mcp/servers;
pulsemcp.com/servers; workos.com/blog (MCP 2026); semrush.com/blog/programmatic-seo;
nakora.ai/blog/github-seo; effloow.com (97M downloads).
