# DMCA Designated Agent Runbook

> Operational reference for registering, maintaining, and exercising the
> DMCA §512 safe harbor for PromptAtrium. Follow the sections in order the
> first time; return to §5 for every subsequent takedown.

---

## TL;DR

1. Register a designated agent at <https://dmca.copyright.gov> — takes ~15 minutes and costs $6.
2. Replace the placeholder in `terms.tsx` (§4 below) with the real registered address.
3. Set up `dmca@promptatrium.com` as a monitored mailbox before launch — every unread notice is a liability exposure.

---

## §1 Decision: Self-designate vs. agent service

**The directory is fully public.** Every field you file — the service provider's
physical address and the agent's name, address, phone, and email — appears in a
searchable public database. The Copyright Office requires a physical street
address for the service provider; P.O. boxes are allowed only for the agent
contact and only with Office approval. The exception for omitting a street
address requires demonstrating a genuine personal-safety threat (written request
to the General Counsel; rarely granted).

**Options:**

| Option | One-time cost | Ongoing | Privacy |
|--------|---------------|---------|---------|
| Self-designate, home address | $6 | $6 every 3 yrs | Home address public |
| Self-designate, virtual/coworking address | $6 + ~$10–50/mo virtual office | Same | Business address public |
| Law firm / DMCA-agent service | $0–$50 setup | ~$90/yr | Firm's address public; founder's address absent |

**Recommendation for a solo pre-launch founder:** Use a virtual business
address (iPostal1, Anytime Mailbox, and similar run $10–25/mo) as the service
provider address, and self-designate. This costs far less than a law firm
service and keeps your home address off the public registry permanently.
Register the virtual address first, then file.

If you have an existing law firm relationship, having them act as agent is
cleaner still — their address, their phone — and ~$90/yr is cheap insurance.
Either way, **do not file your home address.**

---

## §2 Filing walkthrough

### Information to have ready before you open the portal

- **Service provider legal name:** PromptAtrium (or the legal entity name, if
  incorporated; use the exact name)
- **Alternate names / URLs:** promptatrium.com (add any other brand names or
  app names you operate under)
- **Service provider physical street address:** your virtual/business address
  (NOT a P.O. box — physical street required)
- **Designated agent name:** your full legal name (or the firm/service name)
- **Agent mailing address:** may be a P.O. box if different from service
  provider; or same street address
- **Agent phone number:** a real reachable number
- **Agent email:** `dmca@promptatrium.com` (must be monitored — see §3)

### Steps

1. Go to <https://dmca.copyright.gov> (the official US Copyright Office portal).
2. Click **"Create an Account"** — provide your name and email; confirm via
   the verification email.
3. Log in and click **"Designate an Agent."**
4. Enter the service provider information: legal name, street address, and all
   alternate names/URLs you operate under.
5. Enter the designated agent information: name, address, phone, email.
6. Review the preview — this is exactly what will appear in the public directory.
7. Pay the **$6 fee** by credit/debit card. (Fee verified at
   copyright.gov/about/fees.html as of 2026-06-12.)
8. Save the confirmation number and download/screenshot the receipt.

**Renewal:** Designations expire **3 years** from the date of filing (or last
amendment). There is no separate renewal form — filing any amendment resets the
clock and costs another $6.

**Calendar entry (add now):** Set a recurring reminder 2 years 10 months from
your filing date: "DMCA agent renewal due — log in to dmca.copyright.gov and
resubmit ($6)."

---

## §3 Email: dmca@promptatrium.com

This alias **must be a real, monitored mailbox before launch.** An unread
takedown notice is still a received takedown notice — the clock for "expeditious
removal" starts on delivery, not on reading.

- Create the alias in your email provider and route it to a mailbox you check
  at least daily.
- Do not let it auto-filter to spam or archive. Consider a dedicated
  label/folder with a mobile push notification.
- Keep a log of all notices received (see §5f).

---

## §4 ToS patch

In `artifacts/prompt-atrium/src/pages/terms.tsx`, find the DMCA Compliance
subsection (currently starting at line 215). Replace the placeholder paragraph
with the following JSX. Fill in the `TODO` items after you complete
registration:

```tsx
{/* DMCA Compliance — keep in sync with docs/runbooks/dmca-designated-agent.md */}
<p className="mt-2">
  To submit a DMCA takedown notice or counter-notice, contact our registered
  designated agent:
</p>
<p className="mt-2">
  <strong>DMCA Designated Agent</strong><br />
  PromptAtrium{/* TODO: update to legal entity name if incorporated */}<br />
  {/* TODO: insert registered street address after Copyright Office filing */}<br />
  Email: <a href="mailto:dmca@promptatrium.com">dmca@promptatrium.com</a>
</p>
<p className="mt-2">
  Our agent is registered with the U.S. Copyright Office pursuant to 17 U.S.C.
  §512(c)(2). Notices must include all elements required by 17 U.S.C. §512(c)(3).
  Counter-notices must include all elements required by 17 U.S.C. §512(g)(3).
</p>
```

After registering, also update the contact email and mailing address in the
Contact Information card at the bottom of the same file.

---

## §5 Takedown runbook

### 5a. Intake checklist — §512(c)(3) validity check

When a notice arrives at dmca@promptatrium.com, verify all six elements:

- [ ] Physical or electronic signature of the rights holder (or authorized agent)
- [ ] Identification of the copyrighted work claimed to be infringed
- [ ] Identification of the infringing material + URL/location sufficient to find it
- [ ] Complainant's contact info (address, phone, email)
- [ ] Good-faith belief statement: use is not authorized by owner, law, or fair use
- [ ] Accuracy declaration under penalty of perjury + statement of authorization

If any element is **missing or defective**, the notice is not "substantially
compliant" and there is no obligation to act — but best practice is to reply
asking the sender to resubmit with the missing elements. Log the defective
notice anyway (see §5f).

If the use is clearly transformative/educational, consult legal counsel before
removing — but err on the side of removal when uncertain to preserve safe harbor.

### 5b. Expeditious removal

1. **Remove or disable** the identified content promptly. "Expeditious" is not
   defined by statute; industry practice is same-day to 24-hour response for
   small platforms.
2. Note the timestamp — this is your compliance record.

### 5c. Uploader notification

Email the uploader at the address on their account:

> Subject: Content removal notice — PromptAtrium
>
> We received a DMCA takedown notice alleging that your content [title /
> URL] infringes copyright owned by [complainant name]. We have removed
> the content pursuant to 17 U.S.C. §512(c). If you believe this removal
> was in error, you may submit a counter-notice. Reply to this email for
> instructions, or see our DMCA policy at [link to ToS].

Do **not** forward the full notice text (privacy) unless required; a
description is sufficient.

### 5d. Counter-notice flow

A valid counter-notice contains all four §512(g)(3) elements:

- [ ] Subscriber's physical or electronic signature
- [ ] Identification of the removed material and its prior location
- [ ] Statement under penalty of perjury of good-faith belief that removal was
  due to mistake or misidentification
- [ ] Subscriber's name, address, phone + consent to federal court jurisdiction
  and acceptance of service of process

Upon receipt of a valid counter-notice:

1. Forward a copy to the original complainant immediately.
2. Wait **not less than 10 and not more than 14 business days** from receipt.
3. If the complainant has not notified you of a filed court action by the end
   of that window, **restore the content.**
4. If a court action is filed and you are notified, do not restore; await
   legal guidance.

### 5e. Repeat-infringer policy

Adopt and publish the following (in the ToS — a §512(i)(1)(A) safe-harbor
condition):

> **Repeat Infringer Policy.** PromptAtrium will terminate, in appropriate
> circumstances, the accounts of users who are repeat infringers of
> copyright. A user who has received two or more valid DMCA takedown notices
> regarding content they posted may have their account suspended or
> permanently terminated at PromptAtrium's discretion. We reserve the right
> to act on fewer notices where the infringement is willful or substantial.

### 5f. Takedown log

Maintain a private log (e.g., a spreadsheet — NOT committed to git). Schema:

| Column | Description |
|--------|-------------|
| `id` | Sequential, e.g. DMCA-001 |
| `received_at` | ISO 8601 timestamp |
| `complainant` / `complainant_email` | From the notice |
| `asset_url` / `asset_id` | Identified content |
| `notice_valid` | yes / no / defective |
| `removed_at` | Timestamp (blank if invalid) |
| `uploader_notified_at` | Timestamp |
| `counter_notice_received_at` / `counter_notice_valid` | Timestamp / yes / no |
| `complainant_notified_of_counter_at` | Timestamp |
| `restored_at` | Timestamp, "court-hold", or blank |
| `court_action_filed` | yes / no |
| `notes` | Free text |

---

## §6 Sources (verified 2026-06-12)

- DMCA Designated Agent Directory (portal): <https://dmca.copyright.gov>
- DMCA Directory FAQs (fee, renewal, address requirements): <https://www.copyright.gov/dmca-directory/faq.html>
- Copyright Office fee schedule ($6 confirmation): <https://www.copyright.gov/about/fees.html>
- 17 U.S.C. §512 full text: <https://www.law.cornell.edu/uscode/text/17/512>
- Copyright Office §512 resource hub: <https://www.copyright.gov/512/>
- Example third-party DMCA agent service (pricing reference, ~$90/yr): <https://www.internetlegalattorney.com/dmca-agent-service/>
