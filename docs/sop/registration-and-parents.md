# SOP — Registration + parents (Stream 6)

## What shipped
The public enrol wizard and the admin walk-in now capture **who is registering (adult or child)** and **the parent/guardian**, and create or link a `Parent` record, many children per parent. Branch `feature/registration-and-parents`, PR against `banafix` (see the PR for the head SHA). **No migration.** Design calls S6-1..S6-9: `docs/superpowers/specs/2026-11-14-registration-parents-design.md` (read it for the reasoning; this SOP is the record of what is in the code).

## Why
Streams 2-4 already captured level, format, location, schedule and course. Missing: the guardian was optional free text on the student, a `Parent` was only ever created by hand in `/admin/parents`, and a second child of one parent could not be registered at all: `Student.email` is unique and the old upsert would have merged the sibling into the first child.

## How (summary of the calls)
| Topic | Behaviour |
|---|---|
| Minor vs adult | `registeringFor` (`self`/`child`) from the form; a date of birth under 18 forces a guardian even if "self". Public minor: guardian name + email required. Admin minor: name + (email or phone). Adult: own email required, guardian optional |
| Child identity | Own email if given and unclaimed; else `guardian+first-last@domain` (a +tag of the guardian mailbox), deterministic per child, distinct per sibling, split on contradicting birth dates |
| Parent matching | Exact guardian email, else (admin, no email given) the unique phone (last 10 digits); never name; ambiguous = none; a different email with a shared phone = new parent + "possible duplicate" notice |
| Public safety | Existing parent data never overwritten; a guardian is attached only to a student created by that request (or already stored with that exact guardian email); cap of 12 children linked per parent from the public form; throttle per IP, applicant email and guardian email; same response shape either way |
| Admin walk-in | Adult/Child toggle, parent search, `parentId` links to an existing parent (record untouched), guardian email/phone matching as above, blank parent phone may be filled (audited) |
| Consent | Derived from children's enrollments as before, but only those past `pending`/`cancelled` count for a **parent** (`parentConsentFlags`); an unlinked parent has none |
| Admin view | `/admin/parents`: children with live applications and stage, marketing badge, "Register another child"; edit dialog shows same-phone duplicates; child picker lists any live applicant |

## What's involved
- New pure logic: `lib/registration/identity.ts` (email/phone/age/alias helpers), `validate.ts` (`validateRegistrant`), `student.ts` (`chooseStudentEmail`); DB: `parents.ts` (`linkParentToStudent`, `parentIdsByPhone`), `attach.ts` (`attachGuardian`: link + audit, best-effort), `parent-view.ts` (admin view select + derived marketing flag). Tests beside each.
- Routes: `app/api/enrollments/route.ts` (public POST), `app/api/admin/enrollments/route.ts` (walk-in POST; response gains `parent: {id, outcome}|null`), `app/api/admin/parents/route.ts` + `[id]/route.ts` (children with enrollments, `marketingConsent`, `samePhoneParents`), `app/api/admin/students/route.ts` (picker: any live application, returns `status`).
- Consent/messaging: `lib/messaging/consent.ts` (`parentConsentFlags`), `lib/messaging/audience.ts`, `lib/birthdays.ts` (use it), `lib/messaging/recipients.ts` (one mailbox = one message, ignoring a +tag).
- UI: `components/site/enroll/{step-details,enroll-wizard,step-payment,types}.tsx`; `components/admin/{student-registration-modal,parent-form-modal}.tsx`; `app/admin/parents/page.tsx`.
- Verification script: `scripts/test-registration.ts`.
- API body additions: public `POST /api/enrollments` and admin `POST /api/admin/enrollments` accept `registeringFor`; `email` is optional for a child; admin also accepts `parentId`. New 400 messages: `A student under 18 needs a parent or guardian: their name and email address` (public) / `…their name and an email or phone number` (admin), `Invalid guardian email format`, `Add the guardian name, or remove the guardian email`, `registeringFor must be self or child`, `Date of birth cannot be in the future`, `Email is required`, `parentId does not match a parent`.

## Verification
| What | How | Result |
|---|---|---|
| Pure logic + fakes | `npx vitest run lib/registration lib/messaging/consent.test.ts lib/messaging/recipients.test.ts lib/messaging/audience.test.ts` | 59 pass (identity, validation, alias choice incl. twins/own-email traps, parent matching incl. phone ambiguity, never-overwrite, cap, creation race, consent derivation, mailbox dedupe) |
| Types | `npx tsc --noEmit` | clean |
| **Real routes on a scratch Postgres (all migrations applied) with the Paystack mock** | `scripts/test-registration.ts` | **22 checks pass**: adult (no parent); child creates + links a parent and is keyed on the guardian alias; second child links to the same parent; existing parent not overwritten by a different name/phone typed on the form; two siblings stay two students; response JSON shape identical for new guardian, existing guardian and never-seen guardian; same child + second course = same student, 2 applications; minor without guardian and "self" with an under-18 date of birth both 400; guardian typed against an existing student is not linked; pending public applications give a parent no marketing consent, a paid one does; walk-in: attach by `parentId`, match by email, match by unique phone (guardian phone only), 400 without guardian, new guardian creates a parent; admin parent detail lists children with applications and the derived flag; audit rows with the right `adminId` |
| Found by that run | `\D` in a JS template literal became `D` in the SQL (phone matching silently never matched); fixed to `[^0-9]` before this PR |
| Browser (dev server on the scratch DB) | wizard step 2 at 1280px and 375px (child path shows the guardian block, no horizontal overflow, gate hint text); `/admin/parents` list with children + stages; "Register another child" opens the walk-in modal preset to that parent | seen |

**Not verified:** the fee-covered public path with a guardian (same code, not exercised: needs a paid student); a real email delivery to a `+tag` alias (and Yahoo-style providers that reject it); the walk-in modal's parent search box and the Adult toggle submit from the browser (the API calls behind them are proven by the script); the parent edit dialog's duplicate notice; mobile view of the admin pages; the admin enrollments table does not show the parent yet; no real Paystack charge (as for every stream).

## Operate / roll back
No migration, no env, no config: deploy is code only. Roll back = revert the PR; nothing is written that old code cannot read (parents/students/audit rows are ordinary rows; students created under the alias keep working). To undo a wrong link an admin edits the parent in `/admin/parents` (child list). After deploy: nothing to enter.

## Follow-ups
- **Decision for Adebayo:** public linking to an existing parent is by exact typed guardian email with no verification (S6-5). The consequences are contained (no portal, parent data not editable, consent not counted until paid), but an emailed confirmation link would make it airtight.
- Student-side consent has the same weakness S6-6 closes for parents (a pending application's consent flag counts for that student's marketing). Same helper could apply.
- `+tag` aliases do not deliver on providers without plus addressing; if John's families use such providers, ask for the child's own email or add a flag for "alias" in a later migration.
- Phone-only guardian on the public form; admin "merge parents"; show the parent on the enrollments table; unsubscribe link.
