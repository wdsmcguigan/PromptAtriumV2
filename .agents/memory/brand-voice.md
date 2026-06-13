# Brand voice (canonical)

**The single source of truth is `docs/brand/brand-voice-v1.md`.** Decided
2026-06-13. The two `docs/research/` brand drafts are superseded provenance only.

Owner decisions locked: **restrained-cultivation register**; **one-continuum
persona arc** (a user drifts conscript→creator→professional inside one product,
not three markets).

Load-bearing rules to remember before writing any user-facing string:

- **The metaphor boundary** — "leaves for the conscript and creator; plain bark
  for the professional." Garden language NEVER in CLI/MCP/API/error messages or
  pro surfaces. The CLI is `pa pull`, never `pa harvest`.
- **No-trees rule is SCOPED for brand (Owner carve-out, 2026-06-13).** It governs
  *mechanism vocabulary* only — UI labels, nav, CLI/MCP/API, errors, canonical
  action names. The **philosophy & visual/storytelling layer may evoke trees**
  (the seedling→sky-reaching-Mandelbrot arc, branching fractal growth, rings as a
  version-history *figure* in About/onboarding illustration). What stays banned as
  a mechanism word: **"branch"** as the fork-action label — use **"Fork"** (pro) /
  **"grow a cutting"** (Atrium), on clarity grounds (fork ≠ branch). Versions are
  labeled plain **"Version"** in UI. The almanac no-trees entry now carries the
  same carve-out.
- **Four voice-killers:** acceleration-imperative ("supercharge/10x/unlock"),
  condescension-by-jargon, faux-whimsy ("let your prompts bloom"), epistemic
  puffery ("revolutionary"). One occurrence anywhere breaks positioning.
- **Banned words everywhere:** "marketplace," "hack/cheat code." "Prompt
  engineering" is SEO-only, never internal.

Implementation debt the voice creates (doc §12) — for a future copy/UI session:

- **Audit user-facing "branch" → "Fork"/"grow a cutting."** The copy-to-library
  action is `branchMutation` in PromptCard + prompt-detail
  (see `license-registry.md`). Code name is fine; the **labels/tooltips/toasts**
  are not. `arr` (allowsCopy=false) assets must hide/disable the Fork affordance
  with plain copy, not show a dead button.
- Atrium bylines/URLs use `@handle` (`principals.handle`); house curator is
  `@promptatrium`. License labels render via `licenseLabel()` from codes.

Honesty ledger (doc §13): marketing may claim only what `surface-map.md` says is
built. Stacks, versioning UI, one-click capture, growth-stage labels, and the CLI
are NOT yet user-visible — don't claim them as live features.

Logged long-horizon tensions (doc §16, not v1 actions): rename to "The Atrium";
curated-front-page vs algorithmic feed; linear-arc external messaging.
