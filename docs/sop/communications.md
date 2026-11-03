# SOP — Communications: outbox, templates, announcements, feedback (Stream 7)

## What shipped
Every automatic message now goes through one **outbox** (`outbound_messages`), is rendered from **admin-editable
templates**, and is delivered by a **channel adapter**. Email (Resend) works; SMS and WhatsApp are **disabled
adapters** that record each message as `skipped` ("provider not configured") until John chooses a provider.
Admins get `/admin/messages`, `/admin/templates`, `/admin/announcements` and `/admin/feedback`; the public gets
`/feedback`. Branch `feature/communications-outbox`, PR stacked on `feature/assessment-first-admission` (#12).
Design and decisions: `docs/superpowers/specs/2026-11-03-communications-design.md` (D10, builder calls C1–C15).
Plan/ledger: `docs/superpowers/plans/2026-11-03-stream7-communications.md`. Provider costs:
`docs/research/messaging-providers.md`.

## Why
John wants routine communication to run by itself once students are admitted, over email now and WhatsApp/SMS
later through an external provider (not a hand-built WhatsApp integration), and wants costs before committing.
Messages were also scattered: three ad-hoc email functions, a birthday cron with its own dedup table, nothing for
assessment stages, and no feedback channel.

## How (key decisions)
| Decision | Why |
|---|---|
| **One outbox, unique `idempotencyKey` per (event scope, channel, recipient)**, enqueue = `createMany(skipDuplicates)` | A replayed webhook, cron re-run or double click cannot double-send, with no extra locking |
| **Single emit point for enrollment events: inside `transitionEnrollment`** on a won compare-and-set, in the caller's transaction | One place, atomic with the status move, only the CAS winner enqueues. Webhook route is **unchanged** |
| Sending happens **after commit** (`after()` from `next/server`), plus the daily drain cron and an admin **Send now** | No network call in a DB transaction; the fallbacks cover a crashed or out-of-scope request |
| Drain claims rows with a `lockedAt` lease, honours a time budget, paces Resend (600 ms), auto-retries `failed` up to 3 × 10 min | Serverless-safe; a crashed drain's rows are picked up again; `sent` rows are never re-sent |
| **Defaults in code, DB rows override** (`lib/messaging/default-templates.ts`, `templates.ts`) | Nothing to seed; reviewable copy; "Reset to default" |
| Merge fields validated **on save** against the per-event allow-list; HTML escaped once, in the email renderer | A typo cannot ship "Dear {{firstNmae}}"; a hostile name cannot inject markup |
| Consent: marketing types (birthday, new-month, announcement, feedback request) need `consentToEmails` on the student's (or the parent's children's) enrollments; transactional always sends; admin "operational notice" overrides | Lead decision D10b. Skipped rows carry the reason ("No email consent on record") so nothing vanishes silently |
| `application_received` goes to the **applicant only**; guardians are included from the paid stage | Security review: the public form is unauthenticated, mailing a typed guardian address would be a mail relay |
| Birthday dedup = outbox key (`birthday:<year>`); legacy `BirthdayEmailLog` still **read** as an exclusion, no longer written | A deploy after that morning's run cannot re-send; no table dropped (staged migration) |
| Delayed `feedback_request` (`scheduledFor` = enrolment + 30 days) written when `enrolled` fires | No extra cron logic; legacy students never get a surprise blast |
| Fake email provider is honoured **only when `NODE_ENV !== 'production'`** | A test double must be impossible to enable in production |

Alternatives rejected: hooking each of the ~13 status call sites (scattered, easy to miss one); sending inside the
transaction (network inside a DB transaction); a `sending` status (stuck rows after a crash; a lease is simpler);
rewriting the webhook's PDF receipts onto the outbox (attachments, and the webhook is money-critical).

## What's involved
- **Schema/migration:** `prisma/schema.prisma` (appended), `prisma/migrations/20261103153950_communications_outbox/migration.sql`
  (additive, 0 drops): `MessageTemplate`, `OutboundMessage`, `Announcement`, `Feedback`.
- **Pure logic (unit-tested):** `lib/messaging/{template,idempotency,consent,recipients,month,format,audience,compose,events,default-templates}.ts`.
- **DB layer:** `lib/messaging/{outbox,templates,enrollment-events,runs,announce,feedback-notice}.ts`; providers in `lib/messaging/providers/{resend,stubs,fake,index}.ts`.
- **Hooks (small hunks):** `lib/enrollment-transition.ts` (emit on a won CAS), `app/api/enrollments/route.ts` (the direct ack replaced by `emitEnrollmentEvent`), `app/api/admin/enrollments/[id]/assessment/route.ts` (reschedule only).
- **Crons:** `app/api/cron/{birthdays,new-month,messages}/route.ts`, `lib/cron-auth.ts`, `vercel.json`.
- **APIs (all `withAuth`, audited):** `/api/admin/messages` (+`retry`, `dispatch`), `/api/admin/templates` (+`[key]`, `preview`), `/api/admin/announcements` (+`preview`), `/api/admin/feedback` (+`[id]`, `[id]/promote`); public `POST /api/feedback`.
  Audit actions: `message.retry`, `template.update|reset`, `announcement.create`, `feedback.create|update|promote`, `birthday.run`, `newmonth.run`.
- **UI:** `app/admin/{messages,templates,announcements,feedback}/page.tsx`, `app/(site)/feedback/page.tsx`, `components/site/feedback/feedback-form.tsx`; four nav items in `components/admin/admin-layout.tsx`.

### Event → message map
| Event | Trigger | Default | Notes |
|---|---|---|---|
| `application_received` | public enrol POST after payment init | email, applicant only | replaces `sendEnrollmentConfirmation` |
| `application_covered` | public enrol POST when the student's fee is already covered (#12) | email, applicant only | replaces `sendApplicationFeeCovered`; greets by the STORED student name |
| `assessment_paid` | `pending → assessment_paid` | **none** | the webhook's PDF receipt is the email; switch SMS/WhatsApp on in Templates later |
| `assessment_scheduled` | `→ assessment_scheduled`, and a reschedule | email, student + guardian | key carries the slot, so a new slot re-notifies |
| `assessed` | `→ assessed` | email | never includes the result |
| `plan_agreed` | `→ plan_agreed` | email | plan edits do not re-notify |
| `enrolled` | `→ enrolled` | email + delayed `feedback_request` (+30 d) | |
| `cancelled` | — | nothing | |
| birthday (student / parent) | daily cron 06:00 Lagos | email | consent respected |
| new month | cron 1st, 06:00 Lagos | email, enrolled students + their parents | once per Lagos month |
| announcement | admin compose | chosen channels | consent respected unless "operational notice" |
| `class_scheduled`, `class_reminder` | **reserved for Stream 4** | inactive | template slots exist, nothing emits them yet |

## Verification
| Check | Result |
|---|---|
| Unit tests (`npm test`) | 🟢 all pass (template render/validation/escaping, SMS segments, keys, consent, recipients, Lagos month, audience builders, compose incl. no-phone/no-consent, providers incl. production guard, feedback validation, testimonial mapping) |
| Migration on ephemeral Postgres (port 5490) | 🟢 applies after the Stream 2+3 migration; `prisma migrate diff` shows no drift; no `DROP` |
| `scripts/test-messaging.ts` on the scratch DB with the fake email adapter | 🟢 transition enqueues once; 3 concurrent transitions ⇒ 1 winner; replay adds nothing; reschedule re-notifies only on a new slot; SMS/WhatsApp end `skipped` ("SMS provider not configured"); failed send recorded then retried and delivered; sent rows never re-sent; stale lock reclaimed, fresh lock respected; `enrolled` schedules feedback ~30 d out and it is not sent early; `cancelled` sends nothing; birthday run ⇒ student + parent once, re-run 0, non-consenting student and unlinked parent `skipped` with reason, legacy log excluded; new-month once per month; location-filtered announcement, operational override, parents-only; hostile name escaped in stored HTML |
| `npx tsc --noEmit`, `npx next build`, `npm test` | 🟢 tsc clean; build succeeds (needs dummy `RESEND_API_KEY`/`PAYSTACK_SECRET_KEY` env at build time, as before: `lib/email.ts` constructs Resend at import); 166 tests pass |
| Browser check of `/admin/messages`, `/admin/templates` (editor + live preview), `/admin/announcements` (a real broadcast sent from the UI: 7 sent, 11 skipped), `/admin/feedback`, `/feedback` at 1280px and 375px | 🟢 all five render; **no horizontal overflow at 375 or 1280** (measured per page). Fixed on the way: the shared admin layout let any page overflow at 375px (missing `min-w-0`, a long header greeting), two tiny hunks in `components/admin/admin-layout.tsx` |
| Public feedback API against a production build | 🟢 empty ⇒ 400 with field errors; honeypot ⇒ 200 and nothing stored; valid ⇒ 201; 3rd submission in the window ⇒ 429; a new-feedback notice row was written and, with no `RESEND_API_KEY`, ended `skipped` ("Email provider not configured"), proving the `after()` dispatch and the unconfigured path in a real request; promote without consent ⇒ 409, with consent ⇒ 501 (Testimonial model not in this base) |
| **Live email delivery through Resend** | ⚠️ **NOT VERIFIED**: no real `RESEND_API_KEY`. The adapter is code-reviewed and returns `skipped` when the key is missing/placeholder. |
| **Any real SMS/WhatsApp send** | ⚠️ Not built by design (stubs) |
| **A real status transition from the Paystack webhook enqueuing** | ⚠️ proven through `transitionEnrollment` on the scratch DB, not through a real Paystack charge (the webhook route is unchanged) |
| Cron routes over HTTP | 🟢 no secret ⇒ 401; with `CRON_SECRET`: `/api/cron/messages` drained 15, `/api/cron/new-month` and `/api/cron/birthdays` queued and sent (fake adapter) |

## Operate / roll back — READ BEFORE DEPLOYING
1. **Snapshot production first** and use a **direct DB URL** for `prisma migrate deploy` (as for Stream 2+3).
   The migration is additive: 4 new tables, nothing dropped.
2. **New env vars:** `FEEDBACK_EMAIL` (dedicated feedback inbox; also receives new-feedback notices; falls back to
   `ADMIN_EMAIL`), `CRON_SECRET` (**required**: all three crons 401/500 without it), a real `RESEND_API_KEY` and a
   verified `FROM_EMAIL` domain (without them every email row ends `skipped`/`failed`, visible in `/admin/messages`).
   Optional names only: `SMS_PROVIDER`, `WHATSAPP_PROVIDER`. Never set `MESSAGING_EMAIL_PROVIDER` in production (ignored anyway).
3. **New cron entries in `vercel.json`:** `/api/cron/new-month` (`0 5 1 * *`), `/api/cron/messages` (`30 5 * * *`) next to the
   existing birthdays entry. They are daily/monthly because Vercel Hobby rejects sub-daily schedules; on a plan that allows it,
   run the drain hourly. Vercel Cron only runs on production deployments.
4. **First deploy behaviour:** nothing is back-filled. Existing students get no retroactive stage messages and **no feedback
   request** (those are written only when `enrolled` fires). The next birthday run honours consent: **birthdays now skip
   students whose enrollments never ticked email consent, and parents linked to no child** (visible as `skipped`). That is a
   behaviour change from the old cron.
5. **Templates:** open `/admin/templates` once and read the defaults; edit the wording and channels before go-live. Marketing
   emails carry reply-to-opt-out wording, not an unsubscribe link yet.
6. **When John picks a provider:** write one adapter implementing `ChannelProvider` (see `lib/messaging/providers/stubs.ts`),
   return it from `getProvider` in `lib/messaging/providers/index.ts`, switch the channel on per template/announcement, then use
   **Messages → Re-queue provider-skipped** to replay what was skipped. Sender-ID registration takes weeks, so start early (see the research doc).
7. **Forwarding feedback today:** inbound email is not parsed. Point `FEEDBACK_EMAIL` at a mailbox the team reads, and add
   forwarded or WhatsApp feedback with **Admin → Feedback → Add feedback** (source Email/WhatsApp).
8. **Roll back:** code-only revert is safe (tables can stay). To stop all sending without a revert: set channels to none on
   the templates, or unset `RESEND_API_KEY` (rows then record `skipped`).
9. Local recipe: `EPHEMERAL_PG_PORT=5490 scripts/dev/ephemeral-pg.sh reset`, `DATABASE_URL=… npx prisma migrate deploy`,
   `DATABASE_URL=… npx tsx scripts/test-messaging.ts` (refuses non-local databases). **Never `npm install` without `--ignore-scripts`**
   here: `postinstall` runs `prisma migrate deploy` against whatever `DATABASE_URL` is.

## Merge with banafix (2026-11-04)
Merged `origin/banafix` (#10–#12, #14, #15) into this branch. Conflicts and resolutions: `lib/throttle.ts` (both added it: kept banafix's `isThrottled`, the feedback route now uses it); `app/api/enrollments/route.ts` (kept the fee-once-per-student path; both acknowledgement emails now go through the outbox: `application_received` and the new `application_covered`); `components/admin/admin-layout.tsx` (identical fix on both sides, took banafix's); blueprint and checklist (kept every stream's content, comms is §5.4). Emission also now reads the **stored** student identity (name, email) instead of the enrollment's public-form copies. The full migration chain (14 migrations, including the already-deployed `communications_outbox`) applies to an empty Postgres with no drift. All status writes in the merged flows (`mark-paid`, covered fee, `assessment/reuse`, plan, tuition payment, confirm) go through `transitionEnrollment`, so the hook fires for each; cancellations send nothing. Still direct sends, by design: the webhook's PDF receipts and admin alerts, tuition receipts and tuition admin alerts (attachments / admin-only).

## Follow-ups
- ~~Wire promote-to-testimonial~~ **done on the merge with banafix**: `createTestimonial` in `lib/feedback-promotion.ts` now writes an unpublished Stream 8 `Testimonial` (consent required, 409 otherwise; review it in `/admin/testimonials`). Not exercised in a browser after the merge.
- **Scheduling hooks:** `lib/scheduling/hooks.ts` (Stream 4) are still no-ops. Wire them to the outbox with the reserved `class_scheduled` / `class_reminder` templates (they run after commit, so a plain `enqueueMessages` + drain fits).
- Unsubscribe link/endpoint for marketing email (NDPR practice); delivery-receipt webhooks from the future provider.
- Consent for parents has no field of its own: derived from their children's enrollments. Unlinked parents are skipped (question for John).
- Stream 4: emit `class_scheduled` / `class_reminder` through `emitEnrollmentEvent`-style calls (templates are reserved and inactive).
- The public enrolment POST has no rate limit of its own (pre-existing); the acknowledgement it triggers goes only to the applicant's typed address.
- The feedback form reuses `lib/throttle.ts` (`isThrottled`, from the fee-once-per-student work); the contact form could too; `lib/email.ts`'s `sendEnrollmentConfirmation` / `sendBirthdayEmail` are now unused (kept, not deleted).
