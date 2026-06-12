# Prompt Licensing & Platform Terms — Decision Memo

> Scope: what to put in the `license` column on shared assets (prompts, rules files,
> skills, workflows) and the minimum Terms-of-Service language to make copy-to-library /
> version-lineage features safe. Conventions and ecosystem practice, **not legal advice.**
> Researched June 2026. Primary sources linked inline.

---

## TL;DR recommendations

- **(a) Default license on publish:** **CC BY 4.0.** It permits the copy/remix the product
  is built around, and its attribution requirement is what carries author credit through
  version lineage. Offer **CC0** prominently as the "truly free" option (it's what the big
  community prompt repos actually use).
- **(b) Picker menu (schema enum):** `cc0`, `cc-by-4.0` (default), `cc-by-sa-4.0`, `mit`,
  `arr` (all rights reserved / view-only). One-liners below.
- **(c) ToS must contain 4 clauses:** (1) a license-to-operate/display grant to the
  platform; (2) an inter-user license that makes "copy-to-library" a defined, permitted
  fork governed by the asset's chosen license, with a stated default; (3) user
  representations/warranties + indemnity; (4) a DMCA notice-and-takedown process with a
  designated agent. Each is modeled on a named platform below.

---

## 1. Copyrightability baseline (US, EU contrast)

**Most individual prompts are thin-to-uncopyrightable, but that does not stop you from
licensing them** — licensing rides on whatever rights exist plus contract.

- The U.S. Copyright Office's **"Copyright and Artificial Intelligence," Part 2:
  Copyrightability** (published **Jan 29, 2025**) directly addresses prompts. Its
  conclusion, as reported across the legal summaries: *"prompts alone do not provide
  sufficient human control to make users of an AI system the authors of the output.
  Prompts essentially function as instructions that convey unprotectable ideas."* The
  Office found "the mere provision of prompts" does not yield a copyrightable work,
  "although this determination could change as technology evolves." See the
  [Copyright Office AI hub](https://www.copyright.gov/ai/), the
  [Part 2 report (PDF)](https://www.copyright.gov/ai/Copyright-and-Artificial-Intelligence-Part-2-Copyrightability-Report.pdf),
  and the Library of Congress's own
  [explainer blog](https://blogs.loc.gov/copyright/2025/02/inside-the-copyright-offices-report-copyright-and-artificial-intelligence-part-2-copyrightability/).
  Note this is about authorship of **AI output**, not the prompt text itself — but the
  reasoning ("instructions conveying ideas") is exactly why short prompts are weak subject
  matter on their own.
- **Words & short phrases / functionality:** Names, titles, short phrases, and slogans are
  not copyrightable (**37 CFR 202.1**). A utilitarian instruction ("Translate this to
  Hindi") is barred by the **merger doctrine** — when an idea has few ways to be expressed,
  expression and idea merge and neither is protected. Standard tokens ("4k", "step by
  step", "you are an expert…") read as *scènes à faire*. (Practitioner consensus, e.g.
  [Klemchuk](https://www.klemchuk.com/ideate/ai-prompts-new-form-of-intellectual-property),
  [Illusion of More](https://illusionofmore.com/are-ai-prompts-authorship-in-copyright-law/).)
- **What *can* attract thin protection:** a long, creatively-worded prompt, or a curated
  **collection** of prompts (compilation copyright in the selection/arrangement). A
  100-line rules file or a structured skill spec is far more likely to clear the
  originality bar than a one-liner.
- **EU contrast:** The standard is "the author's own intellectual creation" (originality
  via free creative choices). Functional/short text fails it for the same reasons as in the
  US, so the practical outcome is similar. The wrinkle is the EU **sui generis database
  right**, which can protect a substantial **curated library** of prompts (investment in
  obtaining/verifying/presenting) even where no individual prompt is protected.

**Takeaway for the platform:** don't over-promise that a `license` makes a one-line prompt
proprietary. The `license` field's real job is (i) signalling author intent / community
norms and (ii) being the contractual hook that governs copy-to-library. Treat genuinely
valuable prompts as **trade-secret-by-not-publishing** or contract, not copyright.

## 2. What comparable platforms actually do

| Platform | Who owns it | License platform takes | What other users get |
|---|---|---|---|
| **PromptBase** | Creator retains all IP; buyers acquire **no ownership** | (marketplace host) | Buyer gets a **non-exclusive, worldwide, perpetual license to use** the prompt for any purpose; **no resale/redistribution** without creator's written consent ([ToS](https://promptbase.com/tandcs)) |
| **FlowGPT** | User keeps ownership | **Non-exclusive, royalty-free, worldwide, perpetual, irrevocable, sublicensable** license to use/reproduce/modify/distribute/display | Each user gets only a limited license to **download & display locally** while using the service ([ToS](https://flowgpt.com/terms)) |
| **GitHub** | "**You own Your Content**" (D.3) | D.4: license to "**store, host, archive, parse, display, and make copies**" to run/improve the service | D.5: public repos let others "**view and 'fork'**" — a nonexclusive license to use/display/reproduce by forking; D.6: contributions to a licensed repo are **under that same license** ([ToS §D](https://docs.github.com/en/site-policy/github-terms/github-terms-of-service)) |
| **Hugging Face** | Uploader | (host) | **Per-repo declared `license` metadata field** (YAML in the model/dataset card). HF imposes no single license; **OpenRAIL** family is common for models. ([Licenses docs](https://huggingface.co/docs/hub/en/repositories-licenses)) |
| **OpenAI GPT Store** | "You retain your ownership rights in Input and **own the Output**" | (host) | Builder chooses who can use the GPT; **chats are not shared with builders**; no license to the GPT's instructions is granted to end users ([Service terms](https://openai.com/policies/service-terms/), [publishing a GPT](https://help.openai.com/en/articles/8798878-building-and-publishing-a-gpt)) |
| **Anthropic prompt library** | Anthropic | — | Example prompts are published as **illustrative documentation** with **no explicit blanket open license**; the only formal grant is in commercial terms, where **Outputs are assigned to the customer**. Treat the library as "copy these examples" by convention, not by stated license. ([prompt library](https://docs.anthropic.com/en/resources/prompt-library/library)) |

**Pattern:** the closest analogues to PromptAtrium (GitHub, Hugging Face) **make license a
per-asset author choice** and take only a host/display license themselves. Marketplaces
(PromptBase) sell a **license, never copyright**. None of them assign ownership to the
platform — and you shouldn't either.

## 3. License menu — what communities really use

The dominant real-world choice for shared prompt/rules collections on GitHub is **CC0**:

- **`f/awesome-chatgpt-prompts`** (now prompts.chat): prompt content "dedicated to the
  public domain under **CC0 1.0 Universal**"
  ([LICENSE](https://github.com/f/awesome-chatgpt-prompts/blob/main/LICENSE)).
- **`PatrickJS/awesome-cursorrules`** (~40k★, the canonical Cursor rules collection):
  **CC0-1.0** ([repo](https://github.com/PatrickJS/awesome-cursorrules)); individual
  contributed rules occasionally carry MIT.
- MIT and Apache-2.0 show up when a "rules"/"skills" repo also ships code.

Guidance on license *fit*: **Creative Commons explicitly does not recommend its licenses
for software** (no source-distribution or patent terms), and the converse holds — code
licenses like MIT are an awkward fit for pure prose because their operative language
("the Software") assumes code ([CC FAQ](https://creativecommons.org/faq/),
[choosealicense.com/non-software](https://choosealicense.com/non-software/)). So: **CC for
the text, MIT only when the asset is substantially code.**

A "no license" public asset defaults to **all rights reserved** — viewable/forkable on the
host as a matter of the host's ToS, but **not legally reusable** elsewhere
([choosealicense.com/no-permission](https://choosealicense.com/no-permission/)). That's why
a sensible *default* matters: silence is the most restrictive outcome, which is the
opposite of what a sharing community wants.

Prompt-specific licenses (OpenRAIL/RAIL) exist but are **overkill for text artifacts** —
they're built around use-restrictions on *models*. Skip them in the picker.

**Recommended enum + user-facing one-liners:**

| enum value | Label | One-line explanation |
|---|---|---|
| `cc0` | **CC0 1.0 (Public Domain)** | "Anyone can use, change, or sell this — no credit needed. Most prompt libraries use this." |
| `cc-by-4.0` | **CC BY 4.0** *(default)* | "Free to use, remix, even commercially — as long as they credit you." |
| `cc-by-sa-4.0` | **CC BY-SA 4.0** | "Same as CC BY, but anyone's remix must be shared under this same license." |
| `mit` | **MIT** | "Permissive; keep the copyright notice. Best when your asset is mostly code/config." |
| `arr` | **All Rights Reserved** | "Viewable on PromptAtrium, but no one may copy it into their library or republish it." |

(Store the SPDX-style identifier; render the label/blurb from a lookup so the schema stays a
clean enum. `arr` is the one that suppresses the in-app copy-to-library action.)

## 4. Platform terms — the 4 clauses you need

These make forking/remixing/version-lineage defensible. Each mirrors named precedent.

1. **License to operate & display (platform host grant).** Users grant PromptAtrium a
   non-exclusive, worldwide, royalty-free license to **store, host, reproduce, display, and
   distribute** their content as needed to run and improve the service.
   *Model:* GitHub ToS **D.4** ("store, host, archive, parse, display, and make copies …")
   ([§D.4](https://docs.github.com/en/site-policy/github-terms/github-terms-of-service)).

2. **Inter-user license + stated default ("copy-to-library" = fork).** Publishing an asset
   grants **other users the license the author selected** for that asset; **if none is
   selected, the default (CC BY 4.0) applies**, and copying it into your own library and
   creating versions is expressly permitted under that license. Define "copy-to-library" as
   the fork action.
   *Model:* GitHub ToS **D.5** (public repos → others may "view and 'fork'") and **D.6**
   (inbound = outbound license)
   ([§D.5/D.6](https://docs.github.com/en/site-policy/github-terms/github-terms-of-service));
   compare **Stack Exchange**, which applies a single default license (**CC BY-SA 4.0**) to
   *all* contributions so reuse is unambiguous. Note GitHub's rule that **fork licenses
   survive deletion of the original** — adopt the same so lineage doesn't break when an
   author unpublishes.

3. **User representations, warranties & indemnity.** The user warrants they **own or have
   the rights** to everything they publish and that it doesn't infringe third-party rights,
   and **indemnifies** the platform against claims arising from their content.
   *Model:* GitHub ToS **D.3** ("If you post Content you did not create, you are responsible
   for ensuring you have the right to post it")
   ([§D.3](https://docs.github.com/en/site-policy/github-terms/github-terms-of-service)).

4. **DMCA notice-and-takedown + designated agent.** A published process to receive
   infringement notices, remove/disable content, and a counter-notice path — the
   precondition for **17 U.S.C. §512** safe-harbor protection. Register a designated agent
   with the Copyright Office.
   *Model:* GitHub's [DMCA Takedown Policy](https://docs.github.com/en/site-policy/content-removal-policies/dmca-takedown-policy).

---

### Net effect on the schema & settings page
- `license` enum: `cc0 | cc-by-4.0 | cc-by-sa-4.0 | mit | arr`, **default `cc-by-4.0`**.
- The picker is per-asset (matches GitHub/Hugging Face); `arr` disables copy-to-library.
- ToS carries the 4 clauses above; version lineage rides clause 2's fork grant, with
  attribution satisfied by the default CC BY (or the author's stricter choice).

**Sources:** see inline links —
[Copyright Office AI hub](https://www.copyright.gov/ai/) ·
[USCO Part 2 report](https://www.copyright.gov/ai/Copyright-and-Artificial-Intelligence-Part-2-Copyrightability-Report.pdf) ·
[LOC Part 2 blog](https://blogs.loc.gov/copyright/2025/02/inside-the-copyright-offices-report-copyright-and-artificial-intelligence-part-2-copyrightability/) ·
[GitHub ToS §D](https://docs.github.com/en/site-policy/github-terms/github-terms-of-service) ·
[GitHub DMCA policy](https://docs.github.com/en/site-policy/content-removal-policies/dmca-takedown-policy) ·
[PromptBase ToS](https://promptbase.com/tandcs) ·
[FlowGPT ToS](https://flowgpt.com/terms) ·
[Hugging Face licenses](https://huggingface.co/docs/hub/en/repositories-licenses) ·
[OpenAI service terms](https://openai.com/policies/service-terms/) ·
[Anthropic prompt library](https://docs.anthropic.com/en/resources/prompt-library/library) ·
[awesome-chatgpt-prompts CC0](https://github.com/f/awesome-chatgpt-prompts/blob/main/LICENSE) ·
[awesome-cursorrules CC0](https://github.com/PatrickJS/awesome-cursorrules) ·
[CC FAQ (not for software)](https://creativecommons.org/faq/) ·
[choosealicense: non-software](https://choosealicense.com/non-software/) ·
[choosealicense: no-permission](https://choosealicense.com/no-permission/) ·
[37 CFR 202.1](https://www.ecfr.gov/current/title-37/chapter-II/subchapter-A/part-202/section-202.1).
