# PromptAtrium — Brand Voice v1

> **Status: canonical.** This is the single source of truth for how PromptAtrium
> sounds, names things, and decides what copy ships. It supersedes the two
> research drafts in `docs/research/` (`PromptAtriumBrandStrategyv1.md` and
> `Brand Strategy for PromptAtrium.md`), which are retained as provenance only.
> It resolves the long-standing "pick one brand voice" item in
> `docs/plans/OWNER-TODO.md`.
>
> **Decisions locked (Owner, 2026-06-13):** restrained-cultivation register;
> one-continuum persona arc (a user *drifts* conscript → professional inside one
> product, not three separate markets).
>
> **How to use this doc:** before writing any user-facing string — a headline, an
> empty state, an error, a CLI help line, a changelog entry — find the surface in
> §5, the persona in §4, and run the result through the litmus tests in §11. When
> two rules collide, §9 (the metaphor boundary) and §1 (the governing register)
> win.

---

## 0. The one-paragraph version

PromptAtrium is the home for your AI working set — the place the prompts, rules,
skills, and setups you feed an AI are saved, kept findable, versioned, and shown
with what they made. The voice is **warm-intellectual, patient, specific, never
breathless** — the voice of someone who is genuinely good at this and glad to
share, not a productivity coach and not a developer evangelist performing
enthusiasm. Cultivation is the brand's load-bearing metaphor, and it has a hard
boundary: **leaves for the conscript and the creator; plain bark for the
professional.** The metaphor lives in brand and consumer copy; it never enters
the CLI, the MCP layer, the API, or an error message. One "supercharge" anywhere
breaks the whole thing.

---

## 1. Brand ideology / manifesto

We are living through a strange inversion. The tools people use to *think* have
become the fastest-moving, most volatile objects in their lives. Every six weeks
there is a new model, a new interface, a new practice name. People are told —
with rising intensity — that AI is their advantage, their multiplier, their
always-on colleague. And yet most people's actual AI practice is a pile of
browser tabs and a notes app full of prompts they can't find.

The practice is real. The infrastructure is missing.

PromptAtrium exists because the things you feed an AI — the prompt that took
three iterations to get right, the rules file you tuned for a week, the system
prompt that finally made the model stop hedging — are intellectual assets. They
deserve to live somewhere tended. Not in a chat history that scrolls away. Not
in a folder you'll never reopen. Not scattered across a dozen `.cursor/rules`
files no one else on the team has seen.

We are not here to make you faster. We are not an accelerant. We are a *home* —
the place your working set lives, grows, and becomes findable again. The test of
PromptAtrium is not how many hours per week it saves you; it's whether, six
months from now, you still have what you built, and can find it in under a
second.

What we are against, without naming it: the posture that frames AI as
*extraction* — squeeze more from the model, command it harder, dominate your
workflow. That posture produces noise, not craft: two hundred prompts copied
from a listicle, none of them distinguishable from the next. We believe people
get better at working with AI the way they get better at anything that matters —
accumulation, reflection, iteration, tending. Not sprinting. Not hacking.
Tending.

The industry will rename its practice again — prompt engineering became context
engineering; something will replace that. We don't chase the verb. **We own the
noun: the place where the stuff lives.** That place outlasts whatever it's
fashionable to call the work.

The atrium is the room you walk through into the light — open, shared, things
shown in bloom. The greenhouse is where things are cultivated before they're
ready to be shown. PromptAtrium is both: a private practice space and a place to
see what others are growing. We welcome the office worker who just wants a good
prompt to copy. We welcome the image-maker who wants to show the prompt beside
the art. We welcome the developer who versions and composes and syncs an entire
context stack. We ask none of them to become someone else to use this.

The same product, the same data, the same home — at whatever growth stage you're
at.

---

## 2. Brand pillars

Five values. Each is a structural directive — it dictates a real product
decision, not just a tone. Where a pillar is enforced by something already built,
it's named.

### Pillar 1 — Permanence

*Your working knowledge shouldn't evaporate.*

Capture has **zero required fields**: the moment friction enters the save flow,
the asset is lost to chat history forever. Every saved thing exists the instant
it's saved, named or not, tagged or not — search is the primary retrieval path,
not hierarchy. Permanence is also why the data model is one **polymorphic asset
store**: prompts, system prompts, skills, rules, and workflows are all `assets`
with a `kind`, so when the industry invents a new context format next quarter we
absorb it as a new kind, not a migration. And it's why versions are immutable and
automatic — you don't opt into version history; it is the default nature of the
object. (Mechanics: `assets`/`asset_versions`, v2 schema. Usage and attention
flow into the append-only `events` stream — the *water table* — and nothing pumps
uphill; see the almanac.)

### Pillar 2 — Progressive disclosure (as organic growth)

*A seed doesn't look like the mature plant, but it holds the whole blueprint.*

This is the pillar that makes **one product serve three personas**. The Stash
opens as instant capture — by default everything is just `kind=prompt`. Immutable
version history, composition into stacks, MCP bindings, license selection,
per-tool sync — all of it lives in the *same* underlying asset, and stays
invisible until the user's actual workflow asks for it. The interface must never
introduce a concept before the work demands it. The conscript is never made to
step over the professional's tools to save a sentence; the professional never
hits a toy ceiling. This is how a user grows from conscript to professional
*without changing products*.

### Pillar 3 — Receipts

*Show the work with what it made.*

A prompt without its result is a recipe without a photo — technically sufficient,
experientially incomplete. Public assets in the Atrium are shown **with their
results**: the prompt beside the image, the rules file beside the before/after
diff. This is the Atrium's high-trust filter — it quietly excludes untested
"hacks" by asking everyone to show their work. Receipts also means **lineage is
visible**: if an asset was grown from someone else's, the relationship is shown,
and the growth-stage label (seedling / budding / evergreen) is an honest,
user-set signal of maturity, never an algorithmic score. (Mechanics: results
attach to assets; forks carry lineage; stars are the endorsement primitive.)

### Pillar 4 — Composability

*A single asset is the unit; a stack is the practice.*

One prompt is useful. A system prompt + a rules file + a role definition + a few
example turns, composed and versioned as one deployable unit — that's a working
AI setup. The **stack** is our answer to "how do professionals actually use
this?" It drives the sync design: `pa pull my-stack` materializes the whole
composition into a working directory in one command, and a fork of a stack stays
linked, so when the parent updates you see the diff. (Mechanics: stacks =
compositions of assets; the CLI/MCP sync surfaces, plans 30 & phase-2, are where
this earns its keep. Today: partially built — see §13.)

### Pillar 5 — Hospitality

*Welcome the conscript without condescending to the professional.*

The hardest pillar and the most important to protect. The Atrium opens as a
**curated gallery, not a raw popularity feed** — the first thing a newcomer sees
is hand-selected good work. Onboarding asks "what do you want to do today?" with
three equal paths, not a feature tour. Errors are plain English with a next step,
never a code and a shrug. And hospitality is *bidirectional*: the professional's
surfaces stay clinical — the CLI is `pa pull`, never `pa harvest` — because
respecting them means keeping whimsy out of their terminal. The substrate that
moves assets between tools is invisible and unopinionated by design. (Note: the
"mycelium" name for that substrate is held in reserve per the almanac until the
sync layer actually ships — don't deploy the word ahead of the thing.)

> **A note on integrity.** Earlier drafts made integrity a sixth pillar. It isn't
> a pillar — it's the enforcement of all five. "If we say your data is yours, the
> export is complete and machine-readable, not a PDF." "If we say the MCP server
> works with Claude Code on day one, it does." Integrity is what the litmus tests
> in §11 protect. Total register consistency is non-negotiable: one acceleration
> word in one error message destroys positioning built everywhere else.

---

## 3. The named tensions this voice resolves (read once)

Both research drafts were strong and mostly agreed. Where they diverged, or
where they collided with PromptAtrium's own established canon (`.agents/memory/`),
v1 resolves it. Don't relitigate these:

| Tension | Resolution in v1 | Why |
|---|---|---|
| Restrained register vs. grander thesis-voice | **Restrained-cultivation.** | It's the harder register to break and it passes the anti-hype litmus tests both drafts share. |
| Linear arc vs. parallel persona tracks | **One continuum.** | Matches progressive disclosure (Pillar 2) and the surface map's "three faces of one SPA." Outbound copy may *enter* by persona, but the story is one home. |
| "Rings" / "branch" / "root" as brand vocabulary | **Retired.** Versions are plain "Version"; forking is "Fork" / "grow a cutting." | The almanac's **no-trees rule** is law: arboreal words (branch, trunk, root, *rings*) belong to git, not the garden. Both drafts violated this. See §9 and §12. |
| "Stack" collides with developer culture | **Keep "stack."** | The composability/layering implication is load-bearing and "setup" doesn't carry it. Acknowledge the choice in the dev-community launch. |
| Editorial Atrium vs. algorithmic feed | **Curated front page, open publishing.** | Anyone may publish; what's *featured* is our call. Avoids the founder-curation bottleneck without surrendering the water table to a metric monoculture. |
| Rename to "The Atrium" | **Not in v1.** Logged as a long-horizon tension. | The thesis is that we own the noun; "Prompt" anchors SEO and the install base today. Revisit only with evidence. |

---

## 4. The governing register, and the four failure modes

**Warm-intellectual. Patient. Specific. Never breathless.** The voice you want
from someone who is genuinely good at this and happy to share.

The four ways the voice dies — memorize these:

1. **Acceleration-imperative** — "10x your workflow," "supercharge," "unlock,"
   "skyrocket." One word destroys the positioning. This is the posture we're
   against, in language.
2. **Condescension-by-jargon** — "context-injection substrate," "prompt
   engineering primitives." Excludes the conscript *and* fails to impress the
   professional.
3. **Faux-whimsy** — "Let your prompts bloom!" "Nurture your creative seeds!" The
   metaphor is structural, not decorative. If a line reads like a garden-center
   ad, cut it.
4. **Epistemic puffery** — "Revolutionary," "game-changing," "the future of AI
   work." Hollow, and exactly the register we reject.

---

## 5. Voice by persona

One personality, three depths. The voice never changes *who it is*; it adjusts
technical density and how much metaphor it leans on, based on where the user is.

### The Conscript
Arrived from a link or a "good ChatGPT prompt for ___" search. Not embarrassed to
need a starting point — embarrassed by tools that imply they should already know
more. Write as someone who *has* what they're looking for and is glad to help.

- Short sentences, common words. Explain what a thing does before you name it.
- Never "as you know"; assume zero prior AI literacy. Banned on these surfaces:
  *schema, inference, parameters, vector store, system instructions.*
- Every error ends with a next step.

> "Here's a prompt that gets ChatGPT to write professional emails. Copy it, paste
> it, change the name at the end. Save it to your Stash if it works."

### The Creator
Has a real practice; wants two things — better prompts than theirs, and to show
their work in a way that respects the craft. The output matters as much as the
input; they want credit for the *iteration*, not just the final piece.

- Acknowledge the practice as real creative work. "Prompt" and "context" are both
  fine; don't over-explain.
- The cultivation metaphor is most at home here — *seedling, cutting, evergreen*
  map onto iterations creators already feel.

> "Attach the output to the prompt that made it. Show the iteration, not just the
> result — your process is the thing worth seeing."

### The Professional
Developer or power user with `.cursorrules` files and a system prompt they've
spent weeks on. Skeptical of tools that claim to solve this; can *smell* whimsy
in tooling and trusts the product less for it.

- Plain, specific, functional. No metaphor in docs, CLI, or API.
- Lead with capability, not feeling. The MCP server and CLI are their home
  surfaces — write them like good technical documentation.
- **Warmth still applies** — it just comes from quality (typography, density,
  precision) and from prose contexts (changelog, doc intros), never from
  metaphor. Enforce the boundary; don't perform a personality lobotomy.

> "Your whole context stack — system prompt, rules files, role definitions — as
> one versioned unit. `pa pull my-stack` materializes it into the working
> directory. Works with Claude Code, Cursor, and any tool that reads from a
> directory."

---

## 6. Voice by surface

| Surface | Register | Example |
|---|---|---|
| **The Stash** (private library) | Quiet, functional. "This is yours, it's safe, it's organized." | Empty: "Nothing saved yet. Anything you save lands here — no setup required." Pin: "Pinned. It stays at the top until you unpin it." |
| **The Atrium** (public gallery) | Generous, editorial, craft-acknowledging. Output beside input. | Feature header: "The prompt, plus what it made." Curator note: "This week: system prompts that hold up. Not tricks — setups people actually use." |
| **Onboarding** | Orienting, not tutorial-mode. Three paths, no hierarchy. | "I want to find a good prompt and use it." / "I want to organize prompts I already have." / "I want to sync my setup into my AI tools." Then: "Good. Here's where that lives." — one action. |
| **Error messages** | Forgiving, plain, actionable. The system failed, not the user. | Never "Something went wrong." Always: "We couldn't save that — you're offline. It'll save automatically when you reconnect." |
| **CLI / MCP docs** | Clinical, standard, high signal. No warmth required, no metaphor. | `pa pull <asset-or-stack>` — fetches the asset or stack and writes it to the current directory. Examples are real, never contrived. |
| **Changelog / build-in-public** | Warm-intellectual prose; craft notes, not hype. | "We spent two weeks on the version-diff view because the first one showed too much noise. Here's what changed and why." |
| **Marketing site** | Lead with the belief; features are the evidence. | Real examples — an actual prompt, an actual stack, an actual before/after — never stock photos of people at screens. |

---

## 7. Do / Don't — the calibration pairs

| Don't | Do |
|---|---|
| "Supercharge your AI workflow with PromptAtrium." | "The place your AI working set actually lives." |
| "Unlock the full potential of your prompts." | "The prompt that worked last month is still here. So is the version before you changed it." |
| "Let your creativity bloom in our AI garden!" | "Organize your work. Show what you made. Keep what matters." |
| "10x your prompt engineering with our powerful platform." | "A library for everything you feed an AI. Search it, version it, share it." |
| "Never lose a great prompt again!" *(panic-selling)* | "Everything you've saved, searchable in under a second." |
| "Join thousands of prompt engineers building the future of AI." | "People who take their AI setup seriously keep it organized here." |
| "Your digital garden has been harvested! 🌱✨" *(CLI)* | "Sync complete. 3 assets updated in `.cursor/rules`." |
| "Harvest your context with one click using our CLI." | "`pa pull` — fetches your stack into the current directory." |
| "Roll back to v1.4.2 to fix your broken harness." | "View an earlier version. You can restore any previous version of this asset." |
| "Welcome to the ultimate prompt marketplace. Buy the best prompts now." | "Welcome to the Atrium. Setups shown beside the results they produced." |
| "Fatal Error: JSON schema validation failed at node 4." | "We couldn't save this — the formatting doesn't match. Check that it's valid JSON." |
| "We're revolutionizing how humans collaborate with AI." | "Context engineering needs a home. This is it." |
| "Start your free trial and watch your productivity skyrocket." | "Free to start. Save your first prompt in under a minute." |

---

## 8. Lexicon — the canonical names

Consistency in naming is the foundation of trust. These names are fixed. Each is
grounded in an actual mechanism so copy and schema never drift apart.

| Term | What it is | Mechanism | Rationale & rules |
|---|---|---|---|
| **Asset** | Any single saved thing: prompt, system prompt, skill, rules file, workflow, MCP config. | `assets` table, `kind` column. | Agnostic — survives the death of the word "prompt." Canonical noun in nav, docs, and data model. "Prompt" is acceptable informal shorthand, never the canonical label. |
| **The Stash** | The private personal library. | Assets with private visibility. | One syllable, possessive ("my stash"), implies quick capture without ceremony. Not: vault, library, workspace, greenhouse *(greenhouse is brand-layer only)*. |
| **The Atrium** | The public gallery + discovery surface. Always capitalized, proper noun. | Public-visibility assets, shown with results. | Architectural; defined by light. Never "the public gallery," "your profile," or "the community feed." |
| **Version** | An immutable historical state of an asset, captured automatically. | `asset_versions`, integer numbers (not semver), immutable. | Plain everywhere. **Not "rings"** — see the no-trees rule, §9/§12. |
| **Stack** | A composition of assets that deploy together as one versioned unit. | Composition of assets (collection). *Partially built — §13.* | Keep it; the layering implication is load-bearing. "Garden bed" is brand-layer metaphor only — never in nav, CLI, or API. |
| **Fork** / **grow a cutting** | Copy a public asset into your Stash, preserving lineage. | The copy-to-library action. Internal code: `branchMutation` *(code-only; do not surface "branch" in UI — §12).* | "Fork" is canonical in pro/CLI contexts (`pa fork`). "Grow a cutting" is the Atrium-surface variant — "cutting" carries the lineage implication and *resolves* as an action. |
| **Star** | Endorsing / saving a public asset. | `stars` table, feeds the `events` water table. | Not "Like." "Like" is transient social-media validation; "Star" is wayfinding and durable quality, per GitHub convention. |
| **Result** *(brand: fruit)* | The actual output an asset produced. | Results attach to assets (the Atrium's content). | "Result" is the functional UI term. "Fruit" permitted sparingly in Creator copy only. Never "leaves" or "outputs" as the label. |
| **Save / Capture** | The core write action. | Insert into the Stash. | "Save" primary in the Stash; "Capture" acceptable in onboarding/marketing. **Never** "plant," "seed," "sow." |
| **Growth stage** | A maturity label: **Seedling** (early, may not be reliable) / **Budding** (tested, worth trying) / **Evergreen** (stable, proven). | User-set metadata, not algorithmic. *Proposed — §13.* | Honest signal, set by the maker. Not used in professional/CLI contexts. |
| **Handle** | A member's public `@handle` in the Atrium and in asset URLs. | `principals.handle`, required + unique (migration 0003). | The public identity primitive. Addresses assets as `@handle/slug`. |
| **Members / Makers** | The people. | `principals` (auth principals; the house account is the `curation` principal, handle `promptatrium`). | "Members" generally; "Makers" in creator copy. "Users" only in technical docs where it's an established convention. |

### Banned across all surfaces

- **"Marketplace"** — we are a library / home / gallery. The à-la-carte
  transactional model is defunct; the brand keeps its distance.
- **"Hack" / "cheat code"** — context is engineered and tended, not hacked.
- **"Prompt engineering"** — permitted *only* as an SEO term in external
  top-of-funnel content. Internally the discipline is "context management."

---

## 9. The metaphor boundary (the load-bearing rule)

**Leaves for the conscript and the creator; plain bark for the professional.**
Metaphor never supersedes mechanism in a working surface.

**Garden language must NOT appear in:**
- CLI command names, flags, output, or docs
- API endpoints, field names, MCP server logs
- Error messages of any kind
- Navigation labels in the Stash or stack-management UI
- Any copy whose primary reader is the professional
- Pricing and B2B/team materials

**Garden language is welcome in:**
- Marketing hero and manifesto copy
- Atrium asset labels (growth stage, "grow a cutting")
- Brand story / about page; onboarding illustrations and captions
- Community communications and changelog entries

### The naming-cost test
Garden language costs clarity when the metaphor doesn't resolve to a known
action. *Can a person who's never heard of PromptAtrium tell what the button does
from the label alone?*

- "Grow a cutting" — "cutting" carries lineage; resolves. ✓ consumer surfaces.
- "Prune your Stash" — resolves (reduce/remove). ✓
- "Sow a prompt" — "sow" doesn't resolve to a known action. ✗ use "Save."
- "Harvest your context" — doesn't resolve. ✗ use "Export" / "Download."

### The reconciled vocabulary gradient
This corrects the research drafts, which both promoted **arboreal** words. Under
the almanac's **no-trees rule**, tree vocabulary belongs to git, not the garden.

| Register | Terms |
|---|---|
| High credibility (consumer brand) | *evergreen, prune, cultivate, tend, grow, graft, cutting* |
| Moderate | *garden, seed, plant, greenhouse, bloom (verb, sparing)* |
| Consumer surfaces only, use carefully | *seedling, sprout, budding* |
| **Forbidden — arboreal (git owns these)** | *branch, trunk, root, ring* |
| Avoid in pro/B2B copy entirely | *blossom, flourish, nurture, tender* |

---

## 10. Messaging house

### Positioning statement
**PromptAtrium is the home for your AI working set** — the place where prompts,
rules, skills, and working setups are saved, organized, versioned, and shown with
what they made. Model-agnostic, audience-agnostic, built for the long run.

### One-sentence pitch, per persona
- **Conscript:** "Find a prompt that works, and save it somewhere you can find it
  again."
- **Creator:** "Your prompts and the work they made — organized, shareable, with
  the lineage shown."
- **Professional:** "Version your whole context stack, compose it, and sync it
  into any AI tool with one command."

### 30-second pitch, per persona
- **Conscript:** You've found a good prompt before — in a newsletter, a
  colleague's Slack, your own trial and error — and then lost it. PromptAtrium is
  a simple library. Save it when you find it, search it when you need it. No
  setup, no required fields, no learning curve. Just a place where the thing
  lives.
- **Creator:** You iterate. The third version is better than the first and you
  know exactly what changed — but you can't show the before/after. PromptAtrium
  lets you attach the result to the prompt that made it. Version history is
  automatic. When something finally works, you publish it to the Atrium with the
  output attached, and people see your process, not just your result. If someone
  forks your setup and grows it differently, the lineage stays.
- **Professional:** A system prompt you've tuned for weeks, a rules file that took
  three tries, a handful of assets that together *are* your AI setup — living in a
  directory, maybe versioned, definitely not composable or shareable.
  PromptAtrium gives that stack a versioned, composable home. `pa pull my-stack`
  materializes it into any project; the MCP server makes it available inside
  Claude Code, Cursor, anything that reads from a directory. Changes are logged.
  Share a stack and the colleague's fork stays linked to yours.

### Tagline candidates
*Working line history: "where prompts can grow."*

| # | Tagline | Use |
|---|---|---|
| 1 | **The home for your AI working set.** | **Primary** — lead landing copy. Functional, true, owns the noun. |
| 2 | **where prompts can grow** | **Secondary** — quiet supporting line. Lowercase intimacy; "can" is honest epistemic humility. |
| 3 | Tend your AI setup. | Strong brand line for cultivation-forward surfaces; "tend" is the metaphor at its most credible. *(Conscripts may read "tend" as commitment — keep "or just find a prompt and copy it" equally visible.)* |
| 4 | Where your working set lives. | Calm, professional; "lives" has the right permanence. |
| 5 | The place the good prompts go. | Warmly informal; consumer & social. |
| 6 | Show your work. Share your results. | Names the Receipts pillar directly. |
| 7 | Quiet capture. Powerful sync. | Rhythmic summary of the two-surface architecture. |
| 8 | Everything you feed an AI, organized. | Maximum clarity — better as a subhead than a hero. |
| 9 | From a saved prompt to a working setup. | The conscript-to-professional arc; About-page line. |

### Demo narrative (potential-backer audience)
A day-in-the-life, not a feature tour — it opens on the pain (context scatter)
and ends on portability.

> Inside Claude Code, mid-project, I've just spent twenty minutes crafting the
> system prompt that finally makes Claude review code the way I want. It's the
> third time I've written something like it from scratch. This time I save it:
> `pa push code-review-v1` — one second, it's in my Stash, versioned, reachable
> from any project. Two weeks later, new repo: `pa pull code-review-v1`, I adjust
> two lines, push version 2 — the history is automatic. Then I compose three
> assets I always use together into a stack, `my-code-review-setup`; one
> `pa pull` drops all three files in, correctly named. I publish the system
> prompt to the Atrium with a before/after attached and set it to "Budding." Days
> later someone forks it, tunes it for their language, marks theirs "Evergreen" —
> the Atrium shows the lineage, their asset linked to mine, the diff visible.
> People start using theirs more than mine. That's the point. And a conscript on
> their team finds the Evergreen version in the curated Atrium, pastes it into
> ChatGPT, and gets a better review on their first PR — never knowing what a stack
> or an MCP server is. Same data model. Same product. One home.

---

## 11. Litmus tests

Every piece of copy and every design choice must answer **yes** before it ships.

1. **Conscript test** — Could someone who found us through a Google search
   understand what this is and what to do first within 30 seconds? Would they feel
   *smarter* after reading this screen, not dumber?
2. **Professional test** — Would a developer who maintains their own context stack
   find this credible? Is there any line that would make them close the tab
   because it "sounds like marketing"?
3. **Acceleration test** — Does any line — *any* line — promise to make the user
   faster, more productive, or better than they are now? Could it appear on a
   hustle-bro thumbnail? If yes, cut it.
4. **Metaphor-resolution test** — For any garden language: can a stranger tell
   what the thing does from the metaphor alone, or does it create a question the
   copy then has to answer? If it creates a question, use the plain term.
5. **Register-consistency test** — Read the marketing headline, the onboarding
   first screen, the first error a new user sees, and the `pa push` docs in
   sequence. Same brand? One line in the wrong register breaks it.
6. **Plain-bark test** — Any surface a professional touches *while working* (CLI,
   MCP docs, stack editor, version diff, API) — is it free of garden metaphor,
   emoji, and forced whimsy? Could they quote it to a colleague and have it make
   sense?
7. **Promise test** — Does it claim only what's true *today*? If the Atrium is
   called curated, is it? If the MCP server is said to work with Claude Code, does
   it, now? Don't claim what isn't built (§13).
8. **Curator test** — Would a thoughtful curator put this in the Atrium? If it's
   too loud, too promotional, too extraction-focused for a calm, considered,
   anti-hype space — reconsider.

---

## 12. Implementation notes — where the codebase must catch up to the voice

For the information-systems layer. These are concrete reconciliations between this
voice and what's currently in the repo; track them as follow-ups.

- **Retire user-facing "branch."** The copy-to-library action is implemented as
  `branchMutation` in `PromptCard` and prompt-detail (see
  `.agents/memory/license-registry.md`). The *code name* is fine — git owns the
  tree. But any **user-facing** "branch" label must read **"Fork"** (pro) or
  **"Grow a cutting"** (Atrium). Audit button labels, tooltips, and toasts.
- **Retire "rings" anywhere it reached UI.** Draft B's "View earlier rings"
  violates the no-trees rule. Version UI says "Version" / "earlier version."
- **`arr` assets are specimens behind glass.** When `allowsCopy` is false, the
  Fork / "grow a cutting" affordance must be absent or disabled with plain copy
  ("This asset is All Rights Reserved — copying isn't permitted"), never a dead
  button. Matches the almanac's *cuttings are taken under the asset's license.*
- **Handles are the public name.** Atrium URLs and bylines use `@handle`
  (`principals.handle`); the house curator is `@promptatrium`. Don't surface raw
  user IDs in member-facing copy.
- **License labels render from codes.** Never display a stored display-string;
  `licenseLabel()` renders, `normalizeLicense()` maps. (`@shared/licenses`.)
- **Empty states and errors are the highest-leverage voice surfaces** — they're
  seen most and written last. Hold them to §6 and litmus test #5 explicitly.

---

## 13. Honesty ledger — claim only what's built

The Promise test (#7) depends on knowing what exists. Per `surface-map.md`:

- **Live today:** the Stash (capture/search), the Atrium (community sharing,
  stars/favorites, trending), collections, the legacy web app.
- **Built, undeployed:** v2 asset store + PAT auth (`/api/v2`); the MCP server
  (hosted Streamable HTTP + local stdio).
- **Partial / not yet surfaced in UI:** versioning and **stacks** (v2 exists; the
  UI doesn't show them yet); one-click capture (the web "save" is still a modal
  form); growth-stage labels (proposed, not in schema).
- **Planned / aspirational:** the CLI (`pa pull`/`pa push`), per-tool sync
  adapters, browser extension, registry syndication.

**Rule:** until a capability ships, marketing speaks of it in the present tense
*only* on the demo/roadmap framing, never as a live feature claim. When `pa pull`
copy goes on the marketing site, the CLI must exist.

---

## 14. Zero-budget marketing posture

**The work is the marketing.** The Atrium is a public gallery; every well-chosen
feature *is* a demonstration. The posture is curatorial, not promotional.

**Channels**
- **The Atrium (owned, primary).** A weekly editorial pick with a short note on
  why it's worth looking at — 100% on-brand and product-building at once.
- **Changelog / build-in-public.** Honest, specific craft notes. Not "exciting
  new features!" — "here's what we changed in the diff view and why."
- **Creator referral (the share *is* the ad).** When creators post Atrium links
  with results attached, every share demonstrates the core value. Make asset
  pages embeddable and beautiful.
- **Developer communities (earned).** The CLI/MCP story belongs in Claude Code
  and Cursor communities, Show HN, r/MachineLearning — pitched functionally:
  "I built a CLI for versioning and composing AI context stacks. Here's what it
  does." Show the thing.
- **Distribution rails.** Ship the CLI via npm and the MCP server via the
  registries (official, Glama, PulseMCP, mcp.so, Smithery) — capture existing
  intent where developers already search. *(Pollen rule: syndication consumes
  exports and never writes back to the corpus.)*

**What the brand refuses to do**
- No paid acquisition before the Atrium has real content (don't pay to send
  people to an empty gallery).
- No growth hacks or dark patterns — no "invite 3 to unlock," no forced sharing,
  no artificial scarcity, no streaks/leaderboards/upload-volume badges.
- No productivity-claim content ("10 prompts that 10x your ___") — it converts
  and it poisons trust with the professional permanently.
- No AI-hype influencer partnerships — the association is wrong for every persona
  and hard to undo.
- **Evidence exception:** *observed, verifiable* product facts are fair game —
  "400 forks, the most of any asset in the Atrium" is true and allowed.
  *Fabricated or unverifiable* productivity stats ("55% more productive") are not.

**Three launch moments**
1. **The opening of the Atrium** — curate ~50 assets across the three personas,
   then open with one quiet post: "The Atrium is open. Here's what's in it." The
   launch is the curation, not the announcement.
2. **The stack drop** — a Show HN focused on the CLI + MCP server, with a 2-minute
   end-to-end `pa push` / `pa pull` demo in Claude Code. The HN thread is the
   product's first quality test.
3. **Show Your Work** — a curated Atrium collection of assets with compelling
   before/after results, taken to creative communities as "interesting examples,"
   not "check out our product." The product is the frame; the work is the content.

---

## 15. Visual identity — direction (pointer, not spec)

Voice and visuals share one feeling: **serious tools, warm room.** Full visual
spec is out of scope for a *voice* doc; the load-bearing constraints that keep
visuals in register with this voice:

- **Mood:** a Victorian botanical greenhouse (glass, iron, labeled specimens) ×
  a 1990s developer tool (density, no wasted pixels) × an atrium gallery (light
  from above). Not lifestyle beige-and-sage; not hype-cycle purple-and-neon.
- **Light, not glow.** An atrium is defined by overhead light. Directional,
  diffused, material — warm stone, kraft paper, dark glass — never neon.
- **Coexistence rule.** Organic forms live at macro/decorative scale (empty
  states, onboarding, brand marks, Atrium display layer). Developer-credible UI
  lives at micro/functional scale (monospace fields, strict grids, sharp borders
  on data). *Anything you work in looks like a tool; anything that frames the
  work can carry the organic aesthetic.*
- **Palette philosophy:** every color reads as a real material — amber glass,
  kraft paper, dark wood, botanical sage, terracotta. Action accent: amber
  (`#d4a017`). AI/generation: restrained sage (`#6b8f71`) — never the lurid
  AI-gradient. Error: terracotta (`#c4603a`), "needs attention," not "alarm."
- **The fractal is not the logo** (hard line). It lives in lineage/version
  visualizations, growth-stage iconography (progressively self-similar
  branching), and premium loading states. "Simple rules, emergent complexity" —
  one asset, one save, one data model, from which every workflow grows.
- **Type:** a botanical-character serif for display (one size per screen, max), a
  humanist sans for UI, monospace for all asset/code content — the monospace is
  the *voice of the asset itself*, so its rendering quality signals respect for
  the content.
- **Accessibility floor: WCAG AA, non-negotiable.** 4.5:1 on every text/bg pair
  (amber-on-dark is a known small-size failure — test it). Growth-stage icons
  must differ by *shape*, not color alone.

---

## 16. Pushback appendix — flagged tensions to revisit with evidence

Recorded, not silently overruled. Revisit at a future evaluation gate.

1. **Rename to "The Atrium."** "Prompt" anchors single-shot text while the product
   manages skills, rules, MCP configs, and workflows — a long-term dissonance with
   the professional. v1 keeps "PromptAtrium" (SEO + install base, owns the noun).
   Revisit only with evidence of confusion, as a *phased* transition, never an
   abrupt rebrand.
2. **The editorial bottleneck.** Founder curation can throttle the Civitai-style
   discovery loop and make members self-censor. v1's resolution — curated *front
   page*, open *publishing*, with growth stages as the user-side quality signal —
   is the hedge. If curation becomes the growth ceiling, introduce
   star/fork-driven sorting *as a second surface*, never by surrendering the front
   page to a metric monoculture (the water-table caution in the almanac).
3. **Linear arc vs. parallel tracks.** v1 commits to one continuum (Owner
   decision). The honest counter: a conscript rarely *aspires* to manage CLI
   dotfiles. Mitigation already in the voice — outbound copy may enter by persona
   (§4) with distinct entry points, even as the product and story stay unified.
   If marketing data shows the unified arc confusing top-of-funnel, split the
   *external* narrative while keeping the *product* continuum.
4. **Don't over-execute the metaphor boundary into a personality lobotomy.** The
   professional deserves warmth — from design quality and prose (changelog, doc
   intros, errors), not from metaphor in their command names. Enforce the boundary
   on mechanism surfaces; keep the warmth in the prose ones.

---

## Provenance

Synthesized 2026-06-13 from: `docs/research/PromptAtriumBrandStrategyv1.md` (the
restrained "Codified Fertilizer" — primary register source);
`docs/research/Brand Strategy for PromptAtrium.md` (the "Foundational Guidelines"
— progressive-disclosure pillar, professional-wedge GTM, noun-ownership thesis);
`docs/research/brief-3-brand-ideology.md` (originating brief); reconciled against
`.agents/memory/almanac.md` (no-trees rule, water table, cuttings, pollen,
greenhouse, mycelium-held-in-reserve), `docs/plans/surface-map.md` (surfaces and
what's built), and the live mechanics in `.agents/memory/v2-asset-api.md`,
`.agents/memory/license-registry.md`, and `.agents/memory/phase-2-mcp-server.md`
(handles, stars, versions, licenses, MCP/CLI). Owner decisions of 2026-06-13:
restrained register; one-continuum persona arc.
