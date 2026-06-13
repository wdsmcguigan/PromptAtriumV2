# Agent operating rules

## INVARIANTS — the law. Durable; change only with Owner sign-off.

1. **Corpus writes go through a PR**, machine-audited (CI gates) and then
   human-merged (Owner). The DB ingests only from merged corpus
   (`import:seed`). *Enforcement: PR #12's `seed-audit.yml` + branch
   protection (required status checks) — advisory until the Owner enables it.*
2. **Corpus content is byte-exact upstream bytes pinned to a commit SHA**,
   with falsifiable integrity hashes. Nothing that can rewrite content
   (WebFetch, LLM paraphrase) ever touches it.
3. **Judgment flows down** (Owner → Steward → builder agents → workers →
   deterministic scripts); **artifacts flow up** the same chain as PRs.
4. **Uncertain → fail closed.** License doubt → wishlist; ambiguity →
   escalate one level up (never silently proceed); only decisions that are
   truly the Owner's (product, legal, spend, deploys) reach the Owner.
5. **Push repeated agent judgment down into scripts/CI over time** — agents
   are for decisions, substrate is for repetition.

## CURRENT ROLES — disposable roster. Prune ruthlessly; expected to churn.

- **Owner** (wdsmcguigan): decisions, merges, deploys. Self-declared "knows
  enough to be dangerous; ignorance and mindlessness know no bounds" — so,
  by his own instruction: every how-to assumes zero prior knowledge; no gate
  may rely on the Owner catching a technical mistake (his tap is an intent
  check, not a code review); verify his *technical* claims like anyone's. But
  treat his *mission/business* statements as ground truth the docs may lack,
  and treat his naive-sounding questions as a first-class error channel —
  "should we really be altering the Replit databases?" (2026-06-13) caught a
  misframed task that every doc had wrong. When a task's framing rests on an
  unstated business assumption, ask him before acting.
- **Steward** (orchestrator; PRIME, then PLUMB): sequencing, review, this doc.
- **Gardener** (Sonnet): harvest pipeline — PR #12 merged 2026-06-12; next
  up: CI completeness diff + `ContentFile` union follow-ups.
- **Harvest workers** (Sonnet, ephemeral, per-source, via `/harvest-source`).
- **Research consultants**: one bounded deliverable, then archived.
- **Marketing tooling** (future): consumes corpus exports; never writes.
