# PromptAtrium Brand Strategy
### The Codified Fertilizer — v1.0, June 2026

> **Superseded (2026-06-13) by the canonical [`docs/brand/brand-voice-v1.md`](../brand/brand-voice-v1.md).**
> This draft is the *primary register source* for the canonical doc — retained as
> research and provenance. For anything that ships, follow the canonical voice.

---

## 1. Brand Ideology / Manifesto

We are living through a strange inversion.

The tools people use to think have become the fastest-moving, most volatile objects in their lives. Every six weeks there is a new model, a new interface, a new practice name, a new claim about what AI can do. People have been told — with increasing intensity — that AI is their competitive advantage, their productivity multiplier, their always-on colleague. And yet most people's actual AI practice is a pile of browser tabs and a Notes app full of prompts they can't find.

The practice is real. The infrastructure is missing.

PromptAtrium exists because the things you feed an AI — the prompts, the rules, the instructions, the carefully-worded context that took you three iterations to get right — are intellectual assets. They deserve to live somewhere. Not in a chat history that scrolls away. Not in a folder you'll never open again. Not in a repo no one else on the team knows about. Somewhere tended.

We are not here to make you faster. We are not an accelerant. We are a home — the place your working set lives, grows, and becomes findable again. The test of PromptAtrium is not how many hours per week it saves you; it's whether, six months from now, you still have access to what you built.

What we are against, without naming it: we are against the posture that frames AI productivity as extraction. Squeeze more from the model. Command it better. Dominate your workflow. That posture produces noise, not craft. It produces 200 prompts you copied from a listicle and can't distinguish from each other.

We believe people get better at working with AI the same way they get better at anything else that matters: through accumulation, reflection, iteration, and tending. Not sprinting. Not hacking. Tending.

The atrium is the room you walk through to get somewhere — light, open, shared. The greenhouse is where things are cultivated before they're ready to be shown. PromptAtrium is both: a private practice space and a place to see what others are growing.

We welcome the office worker who just wants a good prompt to copy. We welcome the image maker who wants to show the prompt alongside the art. We welcome the developer who wants to version and compose and sync their entire context stack. We do not ask any of them to become someone else to use this product.

The same product, the same data, the same home — at whatever growth stage you're at.

---

## 2. Brand Pillars

### Pillar 1: Permanence
*Your working knowledge shouldn't evaporate.*

In product decisions: this is why capture has zero required fields. The moment friction enters the save-this-prompt flow, the asset is lost to chat history forever. Every prompt saved is a seedling; it doesn't need to be named or categorized to exist. Search is the primary retrieval mechanism — not hierarchical organization — because permanence is only valuable if the thing is findable. This pillar also drives the version history design: changes are logged automatically, like rings in a branch. You don't opt into versioning; versioning is the default nature of the object.

### Pillar 2: Legibility
*What you built should be understandable — to you later, and to others now.*

In product decisions: this is the principle behind attaching outputs to assets in the Atrium. A prompt without its result is a recipe without a photo — technically sufficient, experientially incomplete. Legibility drives the growth stage labeling (seedling / budding / evergreen), which signals maturity and honesty, not just metadata. It drives the "stack" view: when you compose multiple assets into a context setup, the composition itself should be visible, not just the final string. Legibility is also why every public Atrium asset has a visible lineage — if this was forked from someone else's work, that relationship is shown.

### Pillar 3: Composability
*Single assets are the unit; stacks are the practice.*

In product decisions: a single prompt is useful. A system prompt, a rules file, a role definition, a few example interactions composed together and versioned as a unit — that's a working AI setup. The stack is PromptAtrium's answer to the question "how do professionals actually use this?" Composability drives the MCP server design: `pa pull` doesn't just fetch one asset; it can materialize an entire stack into your working directory in a single command. It also drives the fork-with-lineage feature: you grow a cutting of someone's stack, it stays linked, and when they update you see the diff.

### Pillar 4: Hospitality
*The product that welcomes the conscript without condescending to the professional.*

In product decisions: this is the hardest pillar to execute and the most important one to protect. Hospitality means the Atrium opens as a curated gallery, not a raw feed — the first experience is hand-selected good work, not popularity-ranked noise. It means onboarding asks "what do you want to do today?" with three paths, not a feature tour. It means errors are written in plain English with a next step, never a code and a dismissal. It means the CLI docs don't pretend the person reading them needs warmth, but the product marketing never forgets that professionals have colleagues who are conscripts.

### Pillar 5: Integrity
*The brand does what it says, at every layer.*

In product decisions: if we say your data is yours, the export is complete and machine-readable, not a PDF. If we say the Atrium shows work with receipts, the output attachment is a first-class field, not an afterthought. If we say the MCP server connects your garden to any tool, it works with Claude Code, Cursor, and Copilot configs on day one — not "coming soon." Integrity extends to the tone: one "supercharge" in the copy destroys the positioning. Total register consistency is required.

---

## 3. Voice & Tone Guide

### The Governing Register

Warm-intellectual. Patient. Specific. Never breathless. The voice you want from someone who is genuinely good at this and happy to share — not a productivity coach, not a developer evangelist performing enthusiasm, not a SaaS marketing template.

**The four failure modes to avoid:**
- **Acceleration-imperative**: "10x your workflow," "supercharge," "unlock." These destroy the positioning in a single word.
- **Condescension-by-jargon**: "context injection substrate," "prompt engineering primitives." Excludes the conscript without impressing the professional.
- **Faux-whimsy**: "Let your prompts bloom!" "Nurture your creative seeds!" The metaphor is structural, not decorative. If a line reads like a garden center ad, cut it.
- **Epistemic puffery**: "Revolutionary," "game-changing," "the future of AI work." This is the posture we're against.

---

### Per Persona Voice

**The Conscript**

They arrived because someone sent them a link or they searched "good ChatGPT prompt for [task]." They are not embarrassed about needing a starting point. They are embarrassed by tools that make them feel like they should already know more. Write to them as someone who has what they're looking for and is glad to help them find it.

- Sentences are short. Vocabulary is common.
- Explain what a thing does before you name it.
- Never say "as you know" or assume prior AI literacy.
- Error messages end with a next step, always.

*Voice sample*: "Here's a prompt that gets ChatGPT to write professional emails. Copy it, paste it, adjust the name at the end. Save it to your Stash if it works."

**The Creator**

They have a practice and they want two things: to find better prompts than theirs, and to show their work in a way that respects the craft. The output matters as much as the input. They are proud of what they've figured out and want credit for the iteration, not just the final piece.

- Acknowledge the practice as real creative work.
- "Prompt" is fine; "context" is fine. Don't over-explain.
- Growth stage labels (seedling, evergreen) are natural here — they map to creative iterations people already understand.

*Voice sample*: "Attach the output to the prompt that made it. Show the iteration, not just the result. Your creative process is the thing."

**The Professional**

Developer, power user, someone who has `.cursorrules` files and a Claude system prompt they've spent weeks on. They are skeptical of tools that claim to solve this. They can smell whimsy in tooling and it makes them trust the product less.

- Plain, specific, functional. No metaphors in docs or CLI.
- Lead with capability, not feeling.
- The MCP server and CLI are their primary surfaces. Write these like good technical documentation.

*Voice sample*: "Your entire context stack — system prompt, rules files, role definitions — in one versioned unit. `pa pull my-stack` materializes it into your working directory. It works with Claude Code, Cursor, and any tool that reads from a directory."

---

### Per Surface Voice

**The Stash (private library)**

Functional and quiet. Copy is minimal — labels, confirmations, gentle nudges. The emotional register: "this is yours, it's safe, it's organized."

- Empty state: "Nothing saved yet. Anything you save goes here — no setup required."
- Pin confirmation: "Pinned. It'll stay at the top until you unpin it."
- Archive nudge: "You haven't opened this in six months. Archive it to keep things tidy, or leave it."

**The Atrium (public gallery)**

Generous and inviting. Acknowledges craft. Values the output alongside the input.

- Featured asset header: "The prompt, plus what it made."
- Curator's note: "This week: system prompts that hold up. Not tricks — setups people actually use."
- Discover prompt: "Find something worth growing."

**Onboarding**

Three paths, offered without hierarchy. Orienting, not tutorial-mode. Don't list features; ask what they want to do.

- Path 1: "I want to find a good prompt and use it."
- Path 2: "I want to organize the prompts I already have."
- Path 3: "I want to sync my setup into my AI tools."

After they choose: "Good. Here's where that lives." Then one action.

**Error Messages**

Every error has a cause (one sentence, plain English) and a next step (one action). Never: "Something went wrong." Always: "We couldn't save that — you're offline. It'll save automatically when you reconnect."

**CLI / MCP Docs**

Straight technical documentation. No warmth required; no metaphor. Commands are described by what they do. Examples are real, not contrived.

- ✓ `pa pull <asset-or-stack-name>` — fetches the asset or stack from your Stash and writes it to the current directory.
- ✗ "Harvest your prompts from your garden and plant them in your project."

**Marketing Site**

Lead with the positioning, not the feature list. The hero is the belief; the features are the evidence. Use real examples — an actual prompt, an actual stack, an actual before/after from the Atrium — not stock photography of people looking at screens.

---

### Do / Don't Example Pairs

| Don't | Do |
|---|---|
| "Supercharge your AI workflow with PromptAtrium." | "The place your AI working set actually lives." |
| "Unlock the full potential of your prompts." | "The prompt that worked last month is still here. So is the version before you changed it." |
| "Let your creativity bloom in our AI garden!" | "Organize your work. Show what you made. Keep what matters." |
| "10x your prompt engineering with our powerful platform." | "A library for everything you feed an AI. Search it, version it, share it." |
| "Never lose a great prompt again!" (panic-selling) | "Everything you've saved, searchable in under a second." |
| "Join thousands of prompt engineers building the future of AI." | "People who take their AI setup seriously use PromptAtrium to keep it organized." |
| "Our AI-powered smart organization automatically nurtures your prompts." | "Tag it if you want. Search works without tags." |
| "Harvest your context with one click using our CLI." | "`pa pull` — fetches your stack into the current directory." |
| "Be the AI whisperer your team needs." | "Find a setup that works. Keep it. Share it if it's useful." |
| "We're revolutionizing how humans collaborate with AI." | "Context engineering needs a home. This is it." |
| "Start your free trial and watch your productivity skyrocket." | "Free to start. Save your first prompt in under a minute." |
| "Our community of creators and innovators is growing fast." | "The Atrium is editorially curated. Good work, with receipts." |

---

## 4. Lexicon

### Canonical Terms

**Asset** — The canonical term for any single thing saved in PromptAtrium: a prompt, a system prompt, a rules file, a workflow, a role definition. Chosen over "prompt" because the product holds more than prompts; over "context" because that names the category, not the object. "Prompt" is acceptable informal shorthand but not the canonical noun in navigation, docs, or data model.

**Stash** — The private personal library. One syllable, memorable, implies quick capture without ceremony, mild possessive quality ("my stash"). Not: greenhouse (brand layer only), vault, library, or workspace in interface copy.

**The Atrium** — The public gallery. Always capitalized as a proper noun. Architectural, implies light and openness, phonetically coherent with the product name. Never: "the public gallery," "your profile," "the community feed."

**Stack** — A composed set of assets that work together as a versioned, deployable unit. Chosen over "garden bed" for all interface and documentation surfaces. Has direct technical resonance (tech stack, layering). "Garden bed" is brand-layer metaphor only — never in navigation, CLI docs, or API responses.

**Version / Version History** — Plain. Not "rings," not "growth log." Rings is for brand storytelling and onboarding illustration only.

**Fork / Grow a Cutting** — "Fork" is canonical in technical and professional contexts (`pa fork <asset-name>` in CLI). "Grow a cutting" is the Atrium surface variant — it carries the lineage implication a cutting retains from its parent plant. Atrium button: "Fork" (primary) with tooltip: "grows a copy that stays linked to the original."

**Save / Capture** — "Save" is the primary action verb in the Stash. "Capture" acceptable in onboarding/marketing. Never: "plant," "seed," "sow," or any horticulture verb for the core save action.

**Results** — The output attached to an Atrium asset. Labeled "Results" in the UI. Action: "Attach results." Not "leaves," not "fruit," not "outputs."

**Growth Stage** — The maturity label on an asset: **Seedling** (early, experimental, may not be reliable) / **Budding** (tested, worth trying) / **Evergreen** (stable, proven, broadly applicable). User-set, not algorithmic. NOT used in professional/CLI contexts.

**Members / Makers** — Preferred over "users." "Members" for general reference. "Makers" for creator-persona copy. "Users" acceptable only in technical documentation where it is an established convention.

---

### Where Garden Language Must NOT Appear

**Forbidden surfaces:**
- CLI command names, flags, or documentation
- API endpoints, field names, or error messages
- Navigation labels in the Stash or stack management interfaces
- Onboarding UI text beyond the growth stage labels
- Any copy directed primarily at the Professional persona
- Pricing page
- B2B / team sales materials
- Error messages of any kind

**Permitted surfaces:**
- Marketing site hero and manifesto copy
- Atrium asset labels (growth stage, "grow a cutting")
- Brand story / about page
- Onboarding illustrations and captions
- Community communications and changelog entries
- Social content aimed at Creator persona

---

### The Naming Cost Test

Garden language costs clarity when the metaphor doesn't resolve the action. Test: can a person who has never heard of PromptAtrium understand what the button does from the label alone?

- "Grow a cutting" — the word "cutting" carries the lineage implication; the metaphor resolves. ✓ Use on consumer surfaces.
- "Sow a prompt" — "sow" doesn't resolve to a known action. ✗ Use the plain term.
- "Prune your Stash" — resolves clearly (reduce, remove). ✓ Acceptable.
- "Harvest your context" — doesn't resolve. ✗ "Download" or "export" instead.

---

### Vocabulary Gradient (developer/professional credibility scale)

| Register | Terms |
|---|---|
| High credibility in pro contexts | *evergreen, prune, cultivate, root, trunk, branch, tend, grow* |
| Moderate | *garden, seed, plant, organic* |
| Use carefully (consumer surfaces only) | *seedling, sprout, bloom* |
| Avoid in pro/B2B copy | *blossom, flourish, tender, nurture* |

---

## 5. Visual Identity Direction

### Mood in Words

The visual world of PromptAtrium sits at the intersection of three reference points: a Victorian botanical greenhouse (glass, iron, organized light, specimens carefully labeled); a 1990s developer tool with high information density and no wasted pixels; and a gallery that takes the work seriously — not the white cube, but the atrium gallery: light from above, plants along the walls, people moving through.

The feeling is: *serious tools, warm room.*

Not the beige-and-sage of the lifestyle productivity app. Not the dark-purple-and-neon of the hype-cycle AI startup. Something with more material weight than either.

---

### How Light Works

The atrium is architecturally defined by overhead light — a glass ceiling, a clerestory, a skylight. Light in PromptAtrium is directional and diffused, not flat:

- Subtle gradients that imply depth and surface, not decoration
- The sensation of light entering from above, catching edges of UI components
- Backgrounds that feel like materials (warm stone, aged paper, dark glass), not flat fills
- Highlights on interactive elements that suggest light touching a surface, not a neon glow

**Dark mode**: Deep warm charcoal (not blue-black), amber and warm white for primary highlights. A greenhouse at night, lit from within.

**Light mode**: Cream-to-warm-white of paper or vellum, ink-dark text, warm amber accent. Botanical illustration plate, not a flat white web app.

---

### Organic Forms + Developer-Credible UI: The Coexistence Rule

These two visual languages occupy different spatial registers and do not fight.

**Organic forms live at macro/decorative scale**: illustrations, empty states, loading states, onboarding, brand identity marks, Atrium display layer. A seedling illustration in an empty Stash. A fractal branching pattern as an asset's version map visualization.

**Developer-credible UI lives at micro/functional scale**: monospace code fields, strict grid layouts, clear typographic hierarchy, no rounded corners on data tables, no gradients on buttons. The actual interface where work happens.

**The boundary**: Anything the user interacts with for work should look like a tool. Anything that frames or contextualizes the work can carry the organic aesthetic.

---

### The Fractal / Mandelbrot Growth Idea

**The fractal is not the logo.** This is a hard line. A Mandelbrot set as a logo mark creates three problems: computationally associative (math/analytics companies), visually complex at small sizes, front-loads the interesting technical thing over product utility.

**Where the fractal lives, and how:**

**Version / growth visualization**: The asset's version history, when visualized, uses a self-similar branching structure — each fork creates a branch that can itself be forked, echoing the Mandelbrot boundary. Most powerful as an interactive "lineage view" in the Atrium. It does real information work while making the mathematical elegance visible.

**Growth stage iconography**: The three stage icons (Seedling / Budding / Evergreen) use progressively more complex self-similar line structures — from a simple bifurcation at Seedling to a four-level branching tree at Evergreen. Botanical AND mathematically fractal. The two readings reinforce each other.

**Loading / generation states**: When an AI operation is in progress, an animated fractal iteration — zooming into the Mandelbrot boundary — is both visually apt and on-brand (complexity from simple rules). Premium animation, not a spinner.

**The empty Stash**: The empty state illustration shows a single point with copy: "Everything starts here." Subtle enough that most users see "a dot" and feel the simplicity; users who know the reference feel recognized.

**At the brand philosophy level** (About page, investor narrative, not product UI): "Simple rules, emergent complexity." One asset, one save action, one data model — and from that, every workflow from the conscript's single copied prompt to the professional's versioned composable stack. The fractal is a metaphor for how the product scales with the user.

---

### Color Direction

**Dark mode (primary surface):**

| Role | Value | Notes |
|---|---|---|
| Background | `#1a1612` | Warm near-black; brown-tinted charcoal with the warmth of old wood |
| Surface (cards/panels) | `#252018` | Slightly lighter for elevation |
| Border | `#3a3228` | Warm mid-dark, visible but not harsh |
| Primary text | `#f0e8d8` | Warm off-white; good paper held to light |
| Secondary text | `#a0937f` | Aged-ink quality |

**Light mode (secondary surface):**

| Role | Value | Notes |
|---|---|---|
| Background | `#f5f0e8` | Kraft paper, not white |
| Surface (cards) | `#ede6d8` | Slightly darker for elevation |
| Primary text | `#1a1612` | Same near-black as dark mode background |
| Secondary text | `#6b5e4e` | Warm brown-grey |

**Accent colors:**

| Role | Value | Notes |
|---|---|---|
| Action / interactive | `#d4a017` (dark) / `#b8860b` (light) | Amber. The filament — the thing that carries signal. Warm, organic, distinct without aggressive. |
| AI / generation | `#6b8f71` | Restrained sage-green. Botanical, not electric. NOT the lurid purple-to-teal gradient of AI-tool zeitgeist. |
| Success | Warm green, same botanical family | — |
| Error | `#c4603a` | Terracotta. Warm, not alarm-red. "Something needs attention," not "catastrophic failure." |
| Atrium highlight | `#c8a84b` | Pale gold. Cooler than Stash amber to signal the shift from private to public space. |

**Palette philosophy**: Every color should read as a material that exists in the world — amber glass, kraft paper, dark wood, botanical green, terracotta clay. No colors that look like they were generated by a CSS gradient tool.

---

### Typography Direction

**Display / headline**: A serif with botanical character and structural confidence. Target: between a Victorian scientific publication and a contemporary design magazine. Candidate direction: Canela, Editorial New, or Freight Display. Slightly irregular stroke contrast — the calligraphic hand is visible. NOT a humanist geometric sans used as display. NOT a slab serif.

**Body / UI**: A humanist sans with high x-height and strong legibility at small sizes on dark backgrounds. Candidate direction: Inter (credibility) or Instrument Sans (more character). Should not compete with the display serif.

**Monospace**: For all prompt/asset content display, code fields, CLI docs. JetBrains Mono or Berkeley Mono — high legibility, slight warmth, professional. The monospace face matters because prompts ARE displayed as text, and the quality of that rendering signals whether the product respects the content.

**Type hierarchy rule**: One serif display size per screen, maximum. Everything else uses the humanist sans. The monospace appears wherever user-authored content is shown — it is the "voice" of the asset itself.

---

### Accessibility Floor

WCAG AA is the minimum — non-negotiable, in every component brief.

Specific constraints:
- All text on colored backgrounds must meet 4.5:1 contrast ratio. Test every combination — the amber accent on dark backgrounds is a known failure at small sizes.
- Focus states must be visible, using the amber accent. Never removed or reduced to 1px.
- Growth stage icons cannot rely on color alone — each stage has a distinct branching structure shape, not just a color change.
- Monospace content areas: minimum 13px, line-height 1.6+. Prompt text can be long.

---

## 6. Messaging House

### Positioning Statement

PromptAtrium is the personal library for AI context — the place where prompts, rules, and working setups are saved, organized, versioned, and shared. It is model-agnostic, audience-agnostic, and built for the long run: the home your AI working set deserves.

---

### One-Sentence Pitch Per Persona

**Conscript**: "Find a prompt that works, save it somewhere you can find it again."

**Creator**: "Your prompts and the work they made, organized and shareable — with the lineage shown."

**Professional**: "Version your entire context stack, compose it, and sync it into any AI tool with one command."

---

### 30-Second Pitch Per Persona

**Conscript**: You've probably found a good prompt at some point — in a newsletter, a colleague's Slack message, your own trial and error — and then lost it. It's in a browser tab you closed, a notes app you don't search, a chat history that's six months gone. PromptAtrium is a simple library. Save it when you find it, search it when you need it. No setup required, no required fields, no learning curve. It's just a place where the thing lives.

**Creator**: You iterate. The third version of a prompt is better than the first, and you know exactly what you changed, but you can't show anyone the before/after. PromptAtrium lets you attach the result to the prompt that made it — the image, the story, the video. Version history is automatic. When something finally works, you publish it to the Atrium with the output attached, and people can see your process, not just your result. And if someone wants to fork your setup and grow it in a different direction, you keep the lineage.

**Professional**: You have a system prompt you've iterated for weeks, a rules file that took three tries to get right, and a handful of other assets that together make up your actual AI working setup. Right now it lives in a directory, maybe version-controlled, maybe not, definitely not composable or shareable. PromptAtrium gives your context stack a versioned, composable home. `pa pull my-stack` materializes it into any project. The MCP server makes it available inside Claude Code, Cursor, any tool that reads from your working directory. When your setup changes, the version is logged. When you want to share a stack with a colleague, they fork it and it stays linked to yours.

---

### Tagline Candidates

*Current working line: "where prompts can grow"*

| # | Tagline | Assessment |
|---|---|---|
| 1 | **Tend your AI setup.** ← RECOMMENDED PRIMARY | "Tend" is the cultivation vocabulary at its most credible and transitive. Specific, warm, positions against the extraction posture in a single word. Works across all three personas. |
| 2 | where prompts can grow ← RECOMMENDED SECONDARY | Lowercase is the right intimate register. "Can" is honest epistemic humility — not a promise, a possibility. Use as quieter supporting line beneath the primary. |
| 3 | Where your working set lives. | Precise, calm, professional. "Lives" has the right permanence. Slightly flat for consumer surfaces. |
| 4 | The place the good prompts go. | Warmly informal. Works well for consumer and social. May be too informal for B2B. |
| 5 | Your context, at home. | Short. Borrows from the "context engineering" vocabulary moment. Risk: "context" may date. |
| 6 | Cultivate what works. | "Cultivate" on the high-credibility side of the gradient. Honest. Slightly aspirational. |
| 7 | Everything you feed an AI, organized. | Maximum clarity. Better as a subhead than a hero tagline. |
| 8 | The home for serious AI context. | "Serious" signals non-hype without being austere. "Home" is warm. |
| 9 | Prompts, organized. Work, shown. | Functional and precise. Addresses both surfaces (Stash + Atrium). Doesn't inspire but doesn't mislead. |
| 10 | From a saved prompt to a working ecosystem. | Captures the conscript-to-professional arc. Better for the About page than a tagline. |

---

### Demo Narrative (Potential-Backer Audience)

*Framing: not a features demo — a day-in-the-life that shows the problem, the solution, and the scope.*

---

I'm inside Claude Code, working on a project. I've just spent twenty minutes crafting the system prompt that gets Claude to review code exactly the way I want — specific, concrete, no boilerplate. It's good. It's the third time I've written something like this from scratch.

This time, I save it. `pa push "code-review-v1"` — one command, one second, it's in my Stash. Versioned. Timestamped. Accessible from any project I work in.

Two weeks later, a new repo. Different stack, same need. `pa pull code-review-v1` — it's in my working directory. I adjust two lines for the new context and push the change as version 2. The version history is automatic. I didn't have to think about it.

Now I want to go further. I have three assets I always use together: the code review system prompt, a rules file for commit message format, and a role definition that keeps Claude from hedging. I create a stack — call it "my-code-review-setup" — that composes all three. `pa pull my-code-review-setup` drops all three files into the directory, correctly named, ready to use.

I decide to share the code review system prompt in the Atrium. I attach a before/after — two code review outputs, one without the prompt, one with. The difference is visible. I set the growth stage to "Budding" — it works for me, but I haven't tested it widely. I publish it.

Someone finds it, forks it, adjusts it for their language, and publishes the fork. The Atrium shows the lineage — their asset, linked to mine, with the changes visible in the diff. They set their version to "Evergreen." People start using theirs more than mine. That's fine. That's the point.

The conscript on their team finds the Evergreen version through the curated Atrium, copies the prompt into ChatGPT, and gets a better code review on their first pull request. They don't know about stacks or MCP servers. They don't need to.

Same data model. Same product. Three personas, one home.

---

## 7. Zero-Budget Marketing Posture

### The Channel Strategy

PromptAtrium's zero-budget marketing is built on one principle: **the work is the marketing**. The Atrium is a public gallery — every well-chosen featured asset is a demonstration of the product's value. The posture is curatorial, not promotional.

**Primary channels:**

**The Atrium itself (owned media, primary channel)**: Editorial curation of what to feature, how to frame it, what the "week's picks" look like — is a marketing act. A weekly editorial pick delivered with a short note about why this asset is worth looking at is a 100%-on-brand marketing act that also builds the product.

**The changelog / build-in-public**: Publish honest, specific updates about what was built, why, and what didn't work. Not "exciting new features!" — actual craft notes. "We spent two weeks on the version diff view because the first implementation showed too much noise and not enough signal. Here's what we changed and why."

**Creator-persona content (referral, not acquisition)**: When Creators publish work to the Atrium with outputs attached, the natural behavior is to share that Atrium link elsewhere — Twitter/X, Discord, communities. Every share demonstrates the product's core value without any marketing copy. Support this by making Atrium asset pages embeddable and beautiful. **The share IS the ad.**

**Developer communities (earned, not paid)**: The MCP server and CLI story belongs in Claude Code Discord, Cursor forums, r/MachineLearning, Hacker News Show HN. The pitch is specific and functional: "I built a CLI for versioning and composing AI context stacks. Here's what it does." No marketing copy. Show the thing.

**Content that earns distribution**: Curated collections of high-quality assets in specific domains. "The best system prompts for code review, tested." "Five rule sets for AI-assisted writing, with before/after samples." These are product demonstrations that are also genuinely useful resources. They earn links because they solve a real search problem.

---

### What PromptAtrium Explicitly Refuses to Do

- **No paid acquisition before organic proof-of-concept**: Paid ads before the Atrium has real content is burning money to send people to an empty gallery.
- **No growth hacks or dark patterns**: No "invite 3 friends to unlock X." No mandatory social sharing. No artificial scarcity.
- **No productivity-claim content**: PromptAtrium will not publish "10 prompts that will 10x your [anything]" content. Not because the content won't get clicks — it will — but because it destroys the brand positioning with the Professional persona who will never trust a tool that produces it.
- **No partnership with AI-hype accounts or influencers**: The distribution deal that seems efficient creates a brand association that is hard to undo and wrong for every persona.
- **No engagement-bait community features**: No "streak" gamification in the Stash. No leaderboards by number of assets saved. No "power user" badges for upload volume. Engagement metrics that reward quantity over quality will degrade the Atrium.

---

### 3 Launch-Moment Ideas

**Launch 1: The Opening of the Atrium (editorial launch)**

Before any public announcement, curate 50 assets across the three persona types: 15 "conscript" prompts (great for specific common tasks, with notes about where they work and where they don't), 20 "creator" assets (image/writing prompts with outputs attached, covering 5 domains), and 15 "professional" assets (system prompts and stacks from developers in private beta, with lineage visible). Open the Atrium without fanfare — just a post: "The Atrium is open. Here's what's in it." Let the content speak first. **The launch is the curation, not the announcement.**

**Launch 2: The Stack Drop (developer community launch)**

Hacker News Show HN: "I built a CLI and MCP server for versioning and composing AI context stacks." No marketing copy — technical description, a 2-minute demo video showing `pa push`, `pa pull`, and the MCP integration with Claude Code end-to-end. The Stash and Atrium are mentioned as the backing infrastructure, but the post is about the CLI. If the thing works, this earns the Professional persona. The HN thread becomes the product's first quality test.

**Launch 3: The Receipts Collection (creator community launch)**

A curated Atrium collection called "Show Your Work" — 20 assets where creators have attached particularly compelling before/after outputs. Pitched to creative communities (Midjourney Discord, AI art subreddits, writing communities) not as "check out this product" but as "these are interesting examples of prompts with their outputs." **The product is the frame; the work is the content.**

---

## 8. Litmus Tests

Every piece of copy, every design decision, every product choice must answer yes to all of these before it ships.

**1. Does it pass the conscript test?**
Could someone who was told to use AI at work and finds PromptAtrium through a Google search understand what this is and what to do first within 30 seconds? If the first action requires explanation, it's not ready.

**2. Does it respect the professional?**
Would a developer who maintains their own AI context stack find this copy credible? Specifically: is there any line that would cause them to close the tab because it sounds like marketing? If yes, the line is wrong.

**3. Is there any acceleration language?**
Does any line — any line — promise to make the user faster, more productive, more competitive, or better than they are now? If yes, remove it.

**4. Does the metaphor resolve or obscure?**
For any copy using garden/botanical language: could a person who has never heard of PromptAtrium understand what the thing does from the metaphor alone, or does the metaphor create a question the copy then has to answer? If it creates a question, use the plain term.

**5. Is the voice consistent across the entire flow?**
Read the marketing site headline, the onboarding first screen, the first error message a new user will see, and the CLI documentation for `pa push`. Do they feel like they come from the same brand? A single line in the wrong register — a "supercharge" in the error message, botanical whimsy in the CLI docs — breaks the trust that the rest of the brand builds.

**6. Is the professional surface in plain bark?**
Any interface element a Professional persona will interact with during actual work — CLI, MCP docs, stack editor, version diff view, API — must be free of garden metaphor as navigation or label language. Test: could a developer quote this interface to a colleague and have it make sense without context?

**7. Does it promise what it delivers?**
If the Atrium is described as curated, is it actually curated? If the MCP server is described as working with Claude Code, Cursor, and Copilot configs, does it work with all three on day one? The integrity pillar requires every claim to be immediately verifiable. If the thing doesn't work yet, don't claim it yet.

**8. Would a thoughtful curator put this in the Atrium?**
This is a proxy for brand register ceiling. Would this copy, this design choice, this feature feel appropriate in a calm, considered, anti-hype space? If it's too loud, too promotional, too extraction-focused — reconsider.

---

## Appendix: Pushback

*Places where the established constraints may be wrong, argued directly.*

---

**Pushback 1: "Leaves for the conscript and creator; plain bark for the professional" may be executed too rigidly.**

The constraint is correct and should be enforced. But there's a risk of executing it so rigidly that the professional experience feels like a completely different product — cold and tool-like where the rest of PromptAtrium is warm. The professional deserves warmth; they just don't want it in their command names. Warmth for this persona comes from design quality (typography, color, information density done right) and writing style in prose contexts (changelog entries, documentation introductions, error messages) — not from metaphor. "We spent two weeks on this diff view because the first version was noisy" is warm without being botanical. Enforce the metaphor boundary; don't also enforce a personality lobotomy.

**Pushback 2: "Stack" may already be too crowded a term.**

"Stack" has enormous existing meaning in developer culture: tech stack, full stack, stack overflow, call stack. Choosing it as the canonical term for "a composed set of assets" creates semantic competition with all of that prior meaning. The alternative worth considering: "setup" — it's what people already call their AI configuration, it's model-agnostic, casual enough for the conscript, and doesn't collide with existing terms. The argument for keeping "stack" is that the composability implication (layering things) is load-bearing and "setup" doesn't carry it. This is the right argument — keep "stack" — but acknowledge it explicitly in the developer community launch: "we're using 'stack' deliberately, because you do stack these things."

**Pushback 3: The primary tagline recommendation ("Tend your AI setup") may underperform with the conscript at the top of the funnel.**

"Tend" implies ongoing care and attention. For the conscript whose relationship to their AI setup is "find a good prompt, use it, move on," the word may signal a commitment they're not ready to make. Resolution: use "Tend your AI setup" as the primary tagline, but ensure the conscript path in onboarding is extremely clear that tending is optional — "or just find a prompt and copy it" should be equally visible as a path. The tagline sets the brand; the onboarding delivers on all three personas.

**Pushback 4: Opening the Atrium as editorially curated may create a bottleneck that slows community growth.**

The editorial launch is correct for quality control and brand impression. The risk: it creates a culture where members self-censor because they're unsure if their work is "Atrium-quality." The balance: editorial curation for the featured / front-page experience, but any member can publish any asset to the Atrium at any time. The growth stage system (Seedling / Budding / Evergreen) is the user-side quality signal. Editorial curation is the staff-side front-page selection. These are two different things and should be communicated as such: "The Atrium is open to everyone. What's featured is our call."

**Pushback 5: The "no productivity-claim content" rule needs an evidence exception carved out.**

The rule against "10 prompts that will 10x your [anything]" content is right. But when PromptAtrium has real user data showing real outcomes — not fabricated marketing stats, but observed product behavior — that should be shareable. The distinction: "55% more productive" (manufactured, unverifiable) is forbidden. "400 forks of this prompt, the most of any asset in the Atrium" is a marketing claim that is also true and verifiable. Reserve the right to use evidence. Prohibit fabricated or unverifiable productivity claims. The brand's integrity pillar depends on this distinction being honored, not on avoiding quantification altogether.

---

*End of document. Version 1.0. June 2026.*

*This document is the fertilizer — it feeds the work. The work feeds itself.*

---

### Research Foundation

This document was synthesized from six parallel research angles:

1. **Adjacent brand voices** — GitHub, Notion, Are.na, Linear, Obsidian, Civitai, Anthropic: tone, positioning, lexicon, sophistication calibration
2. **Competitive landscape** — PromptBase, FlowGPT, PromptHero, AIPRM, Snack Prompt, LangSmith/LangChain Hub, PromptLayer, Braintrust, Langfuse, Vellum, PromptHub, Helicone, Humanloop (acquired/shut down Aug 2025)
3. **Horticulture as brand metaphor** — Sprout Social, digital garden movement (Caufield, Matuschak, Appleton), Pragmatic Programmer lineage, failure modes and vocabulary gradient
4. **Fractal / Mandelbrot visual precedents** — IBM Fractalizer campaign, YanchWare Fractal Cloud, Fractal Analytics, Observable generative art, generative brand identity trends 2024–25
5. **Progressive disclosure as brand philosophy** — Stripe's abstraction ladder (Kenneth Auchenberg), Linear's opinionated restraint (Karri Saarinen), Vercel's simplification-first arc (Guillermo Rauch), Tailwind's composable primitives (Adam Wathan), GitHub Primer design system
6. **Tone whitespace analysis** — AI fatigue data (48% developer self-report, 2025), calm tech movement, PKM archetype (Pinboard, Are.na, Obsidian, Raindrop), the gardener's gap as unoccupied positioning territory
