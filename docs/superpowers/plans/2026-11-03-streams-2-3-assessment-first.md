# Streams 2+3 — Location/Offering model + Assessment-first admission: Implementation Plan (ledger)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax. **This file is the ledger**: tick boxes and append to "Ledger log" as work lands.

**Goal:** Paying the fee buys an *assessment*; admission follows. Admin-editable locations, offerings and per-class rates; a student sees only what their location offers.

**Architecture:** Additive staged migration (new tables + nullable plan fields; old `Course` columns deprecated, not dropped). One pure guard (`lib/enrollment-status.ts`) owns every `Enrollment.status` move; all writers use a compare-and-set helper so webhook/admin paths are idempotent. Public flow reads `CourseOffering`/`OfferingRate` through one shared "offerable" predicate.

**Tech Stack:** Next.js 15 (App Router), Prisma 6 / Postgres, Paystack, Resend, Vitest (cherry-picked from S1).

**Spec:** `docs/superpowers/specs/2026-11-03-assessment-first-admission-design.md` (approved; D6–D11 settled). Executors read it.

## Global Constraints
- Amounts are whole naira `Int`. No new hardcoded price, fee or location list anywhere (D11). `lib/locations.ts` survives only as **seed input** for the migration/seed.
- DB names stay (`applicationPaid`, `applicationFeeAmount`, `ApplicationPayment`, webhook metadata); "application fee" → "assessment fee" is **copy-only** (UI, emails, receipts).
- Money/state changes only in webhook and admin routes, never on the redirect/verify route. Every admin mutation calls `logAdminAction` (`lib/audit.ts`).
- Legacy `enrolled`/`pending` rows keep their values. Legacy balance keeps using deprecated `Course.pricing[selectedMode]` (tuition route) until Stream 5.
- **Never** run migrate/seed/tests against `.env` (production). Ephemeral Postgres only: `DATABASE_URL=postgresql://postgres@127.0.0.1:5455/postgres`. **Never `npm install`/`npm ci` without `--ignore-scripts`** (`postinstall` runs `prisma migrate deploy`).
- No AI attribution in commits/PR (no `Co-Authored-By`, no "Generated with" footer, no session link) — subagents too. Branch pushed to exactly `feature/assessment-first-admission`; never `claude/*`.
- Do not edit `components/site/enroll/policy-dialog.tsx` or `components/site/policies/policies.ts`. Do not touch testimonials/trusted-by/events/site-stats (S8), `CurriculumModule.weeks` or per-class/12-module copy (S1).
- Fast checks before each push: `npx tsc --noEmit`, `npx next build`, `npm test`. ESLint is broken (ignore).

## Builder decisions (left open by the spec; recorded in the SOP)
| # | Decision | Why |
|---|---|---|
| B1 | `Location.slug @unique` added; public chooser persists as `?location=<slug>` (no cookie) | shareable URLs, server-component friendly |
| B2 | `Assessment` uses `preferredDate` + `preferredTimeBand` (`morning|afternoon|evening|flexible`), not start/end | matches the existing schedule vocabulary |
| B3 | `Assessment.address`/`landmark` (home visit location) | HOME assessments need a place; resolves round-2 "address discarded" for assessments |
| B4 | Public enrol creates the `Assessment{requested}` row with the pending `Enrollment`; stale-pending cleanup cascades it | preferences exist before payment |
| B5 | Guard table adds one move beyond the spec: `assessed → assessment_scheduled` (re-assessment = new `Assessment` row). `cancelled` from any non-terminal state; `enrolled`/`cancelled` terminal | spec says many assessments per enrollment |
| B6 | "Offerable" = offering `isActive` ∧ location `isActive` ∧ ≥1 `OfferingRate`. Anything else is invisible publicly; a course with none shows "Enrolment opening soon" | anti-goal: never a wrong/absent price |
| B7 | Admin walk-in: `courseId` + `locationId` required, `offeringId` optional (must match course+location); `selectedMode` = offering's format name or `''` | admin can register before rates exist |
| B8 | Public `POST /api/enrollments` requires `offeringId` (offerable); legacy `courseId+selectedMode` body is dropped in the public-flow commit | legacy offerings are inactive, so the old shape must not work |
| B9 | Duplicate guard: block if the student has a non-`pending`, non-`cancelled` enrollment for the course; stale `pending` still deleted | status vocabulary grew |
| B10 | Paystack base URL overridable via `PAYSTACK_BASE_URL` (default unchanged) so a local mock can exercise the real webhook | lets us prove `assessment_paid` without John's keys |
| B11 | Seat enforcement removed everywhere (POST, wizard, webhook); admin seat inputs stay with a "no longer enforced" note | D9 |
| B12 | Existing hole fixed: webhook flips `ApplicationPayment` + `Enrollment` in ONE transaction (today a failed second write leaves the payment `completed` so Paystack retries are skipped) | idempotency intact through cutover |
| B13 | Deprecated `Course` NOT NULL columns get DB defaults (`location ''`, `pricing '{}'`, `duration ''`, `availableModes {}`) so new courses can be created without them | forms stop collecting them |

## Review Focus (inputs the spec implies but doesn't spell out; each has a test below)
1. Webhook delivered **twice**, or **concurrently**, for one reference → exactly one transition, one audit row, no second receipt (T2).
2. Late `charge.success` for an enrollment that is `cancelled` or already legacy `enrolled` → payment recorded, status NOT moved backwards, audit notes it (T2).
3. Rate edited after `plan_agreed` → enrollment `ratePerClass` unchanged; plan with a duration that has no rate is rejected (T1 logic + T2 route).
4. Location deactivated/offering with zero rates → absent from public list, `/api/courses/[id]` offerings, and POST enrol (T6).
5. Legacy `enrolled` row with null plan fields → admin list/panel, receipt and tuition route do not crash (T3, T5).

## File map
**Create:** `lib/enrollment-status.ts` (+test) · `lib/offering-rates.ts` (+test) · `lib/assessment-fee.ts` (+test) · `lib/offerings.ts` (offerable predicate + public shapes) · `lib/enrollment-transition.ts` (CAS helper) · `prisma/migrations/<ts>_assessment_first_admission/migration.sql` · `scripts/dev/ephemeral-pg.sh` · `scripts/verify-migration.sh` + `scripts/fixtures/legacy-data.sql` · `scripts/mock-paystack.mjs` · API: `app/api/admin/locations/**`, `app/api/admin/courses/[id]/offerings/**`, `app/api/admin/courses/[id]/materials/**`, `app/api/admin/enrollments/[id]/{assessment,plan,confirm}/**`, `app/api/locations/route.ts` (public) · UI: `app/admin/locations/page.tsx`, `components/admin/{location-form-modal,offerings-tab,materials-tab}.tsx`, `components/admin/enrollments/*` (split of the 740-line page: `enrollment-table`, `enrollment-filters`, `assessment-plan-panel`, `status-badge`), `components/site/location-chooser.tsx`.
**Modify:** `prisma/schema.prisma`, `prisma/seed.ts`, `app/api/webhooks/paystack/route.ts`, `app/api/admin/enrollments/route.ts`, `…/[id]/mark-paid/route.ts`, `…/[id]/tuition/route.ts`, `app/api/enrollments/route.ts`, `app/api/enrollments/verify/route.ts`, `app/api/courses/route.ts`, `app/api/courses/[id]/route.ts`, `app/api/admin/courses/**`, `app/admin/courses/**`, `app/admin/enrollments/page.tsx`, `components/admin/{admin-layout,student-registration-modal}.tsx`, `components/site/enroll/*`, `components/site/courses/*`, `app/(site)/courses/**`, `lib/{email,receipt,paystack}.ts`, `scripts/test-webhook.mjs`, `package.json` (test script via cherry-pick).
**Delete:** `lib/application-fee.ts` (T2).

## Commit plan (separately reviewable, in this order)
1. `feat(db): location/offering/assessment schema + staged migration` — T0, T1
2. `feat(admission): status machine, assessment-first webhook + admin routes` — T2
3. `feat(admin): locations, offerings, materials, enrollment pipeline UI` — T3, T4
4. `feat(site): location-first chooser, per-class rates, assessment wizard` — T5, T6
5. `docs: assessment-first SOP, checklist, blueprint, walk-in SOP` — T7

---

### Task 0: Tooling + ephemeral DB harness
**Files:** Create `scripts/dev/ephemeral-pg.sh`; modify `package.json` (via Vitest cherry-pick).
**Interfaces — Produces:** `scripts/dev/ephemeral-pg.sh start|stop` → Postgres 16 on `127.0.0.1:5455`, data dir under the scratchpad/tmp, `DATABASE_URL=postgresql://postgres@127.0.0.1:5455/postgres`; `npm test` runs Vitest.
- [ ] Deps installed with `npm ci --ignore-scripts`; `DATABASE_URL=<dummy> npx prisma generate` works.
- [ ] Script wraps `initdb -U postgres --auth=trust`, `LC_ALL=C pg_ctl -o "-p 5455 -k /tmp -c listen_addresses=127.0.0.1" start`; refuses to run if `DATABASE_URL` host is not `127.0.0.1`.
- [ ] Before the first test: `git log banafix..feature/per-class-copy-and-modules-9e8798` for S1's Vitest commit; `git cherry-pick` it (do not create another config). If still absent, ask the lead before inventing one.

### Task 1: Schema + staged data-preserving migration + seed (commit 1)
**Files:** `prisma/schema.prisma`, `prisma/migrations/<ts>_assessment_first_admission/migration.sql`, `prisma/seed.ts`, `scripts/verify-migration.sh`, `scripts/fixtures/legacy-data.sql`.
**Interfaces — Produces (Prisma models):**
```
Location { id, name @unique, slug @unique, kind LocationKind(PHYSICAL|ONLINE), assessmentFee Int, isActive, order, address? }
CourseOffering { id, courseId, locationId, deliveryModeId, classesPerWeekOptions Int[] @default([1,2]), isActive @default(false→ explicit), @@unique([courseId,locationId,deliveryModeId]) }
OfferingRate { id, offeringId, durationMins Int, pricePerClass Int, @@unique([offeringId,durationMins]) }   // onDelete Cascade
Material { id, courseId, name, price Int, required Boolean, isActive }
Assessment { id, enrollmentId, status String(requested|scheduled|completed|cancelled|no_show), arrangement String(HOME|CENTRE|ONLINE), preferredDate?, preferredTimeBand?, address?, landmark?, scheduledAt?, assessorId? (→Instructor, SetNull), resultLevel?, resultNotes?, recommendedOfferingId? (→CourseOffering SetNull), completedAt?, createdAt, updatedAt }  // enrollment onDelete Cascade
Enrollment += locationId? (→Location), offeringId? (→CourseOffering), durationMins?, classesPerWeek?, plannedClasses?, ratePerClass? ; @@index locationId, offeringId
Course: pricing/availableModes/location/duration get DB defaults (B13); comment-mark all deprecated columns; no drops.
```
Use Postgres enums only for `LocationKind`; other vocabularies are `String` (matches repo style).
- [ ] Edit schema; `prisma migrate diff --from-schema-datamodel <old> --to-schema-datamodel <new> --script` for DDL; hand-append the data section below to the same `migration.sql`.
- [ ] Data section, in this order: (a) insert `Location` rows for the 8 names in `lib/locations.ts` ∪ distinct `courses.location` not already present; kind `ONLINE` for Online/Diaspora, fee 5000 for lagos/abuja/online, 8000 for diaspora/international, else 2000 (match on `lower(btrim(name))`); slug = lowercased, non-alnum → `-`; `order` = list position; (b) one `CourseOffering` per (course, location, `availableModes` entry that matches a `DeliveryMode.name`), **`isActive=false`, no rates**; `RAISE NOTICE` the count of mode names with no `DeliveryMode` row; (c) backfill `enrollments.locationId` via `lower(btrim(courses.location))`, and `offeringId` via (course, location, `selectedMode`→DeliveryMode) when that offering exists; (d) no status changes.
- [ ] `scripts/fixtures/legacy-data.sql`: ≥3 courses (Lagos 2 modes, Online 1 mode, Ondo with a mode name that has no `DeliveryMode` row), students, enrollments in `pending`/`enrolled`, one with padded-case location text, one `ApplicationPayment`, one `TuitionPayment`.
- [ ] `scripts/verify-migration.sh`: ephemeral DB → apply all migrations up to the previous one → load fixture → apply the new one → assert with `psql`: zero row loss in every legacy table; all enrollment statuses unchanged; every enrollment has `locationId`; every offering `isActive=false` and `OfferingRate` count = 0; Location fees per tier; the orphan mode skipped with notice; `Course.pricing/location` untouched. Also assert `prisma migrate status` reports up to date.
- [ ] `prisma/seed.ts`: seed `Location` from `lib/locations.ts` with the same fee tiers (idempotent upsert by name) — seed data only, code never reads the list at runtime.
- [ ] Run verify script → all assertions pass; `npx tsc --noEmit`.
- [ ] Commit 1.

### Task 2: Status machine, fee lookup, rate logic, webhook + admin routes (commit 2)
**Files:** create `lib/enrollment-status.ts`, `lib/enrollment-transition.ts`, `lib/offering-rates.ts`, `lib/assessment-fee.ts` (+ `*.test.ts` beside each); modify webhook, `app/api/admin/enrollments/route.ts`, `[id]/mark-paid`, `[id]/tuition`, `app/api/enrollments/route.ts` (interim: still `courseId+selectedMode`, location resolved from `Course.location` name → `Location`, fee from `Location.assessmentFee`), `app/api/enrollments/verify/route.ts` (read-only; unchanged semantics), `lib/paystack.ts` (B10), `scripts/test-webhook.mjs`, `scripts/mock-paystack.mjs`; delete `lib/application-fee.ts`. Create routes `app/api/admin/enrollments/[id]/assessment/route.ts` (POST schedule · PATCH result/edit), `[id]/plan/route.ts` (POST), `[id]/confirm/route.ts` (POST).
**Interfaces — Produces:**
```ts
// lib/enrollment-status.ts
export type EnrollmentStatus = 'pending'|'assessment_paid'|'assessment_scheduled'|'assessed'|'plan_agreed'|'enrolled'|'cancelled'
export const ALLOWED_TRANSITIONS: Record<EnrollmentStatus, readonly EnrollmentStatus[]>
export function isEnrollmentStatus(s: string): s is EnrollmentStatus
export function canTransition(from: string, to: string): boolean   // unknown statuses → false
export class InvalidTransitionError extends Error { from: string; to: string }
export function assertTransition(from: string, to: string): void
export const TERMINAL: readonly EnrollmentStatus[]                 // enrolled, cancelled
// lib/enrollment-transition.ts — compare-and-set; tx is a Prisma client/tx
export async function transitionEnrollment(tx, id: string, from: EnrollmentStatus, to: EnrollmentStatus, data?: Prisma.EnrollmentUpdateManyMutationInput): Promise<boolean> // asserts guard, updateMany where {id,status:from}, true iff count===1
// lib/offering-rates.ts
export function resolveRate(rates: {durationMins:number; pricePerClass:number}[], durationMins: number): number | null
export function fromRate(rates): number | null                      // min pricePerClass
export function planTotal(ratePerClass: number, plannedClasses: number): number
export function buildPlanSnapshot(input:{rates; classesPerWeekOptions:number[]; durationMins:number; classesPerWeek:number; plannedClasses:number}): {ok:true; ratePerClass:number; durationMins; classesPerWeek; plannedClasses} | {ok:false; error:string}
// lib/assessment-fee.ts
export async function getAssessmentFee(db:{location:{findUnique(args:any):Promise<{assessmentFee:number;isActive:boolean}|null>}}, locationId: string): Promise<number>  // throws AssessmentFeeError if missing/inactive
export function formatNaira... (reuse lib/site.formatNaira; do not add another)
```
- [ ] **Tests first** (`npm test` red → green): guard — every legal edge in the table passes; `pending→assessed`, `pending→enrolled`, `enrolled→*`, `cancelled→*`, `assessed→pending` fail; `cancelled` reachable from `pending, assessment_paid, assessment_scheduled, assessed, plan_agreed` but not from `enrolled`/`cancelled`; `assessed→assessment_scheduled` passes (B5); unknown/legacy strings (`application_paid`, `''`) → false. Rates — `resolveRate` exact match / missing → null; `buildPlanSnapshot` rejects a duration with no rate, `classesPerWeek` not in options, `plannedClasses` ≤0 or non-integer, and returns the rate snapshot; `fromRate([])` → null. Fee — inactive/missing location throws; value returned verbatim.
- [ ] Webhook `handleChargeSuccess`: verify with Paystack → ONE `$transaction`: `applicationPayment.updateMany({where:{id, status:{not:'completed'}}})` — `count 0` ⇒ already processed, return before anything else; then `transitionEnrollment(tx, id, 'pending','assessment_paid',{applicationPaid:true})`; if it returns false (status ≠ pending) just ensure `applicationPaid:true` and audit `enrollment.fee_paid_unexpected_state` with the current status; **no `course.updateMany` seat decrement**. Audit `enrollment.assessment_paid` (admin null) only when the transition happened. Emails after the transaction, still never rethrown. `charge.failed` must not move a non-`pending` enrollment.
- [ ] Admin cash `mark-paid` and walk-in `feePaid`: same `pending→assessment_paid` via helper; fee amount from `Location.assessmentFee` (enrollment's `locationId`; walk-in resolves from body `locationId` once T3 lands — interim from course location); idempotent 400 if already `applicationPaid`; audits keep their action names plus `toStatus`.
- [ ] Public `POST /api/enrollments` (interim): no seat check; B9 duplicate guard; creates enrollment with `locationId`; fee from `getAssessmentFee`; `applicationFeeAmount` still written.
- [ ] Assessment routes (all `withAuth`, all audited `assessment.schedule|result|edit`): **schedule** `{scheduledAt, arrangement?, assessorId?, address?}` — requires status `assessment_paid`|`assessed`(re-assess, new row) → `assessment_scheduled`; for legacy `enrolled`/`pending` rows it may only create a standalone `Assessment` without moving status. **Result** `{resultLevel, resultNotes?, recommendedOfferingId?, assessorId?, completedAt?}` on the latest assessment: `assessment_scheduled → assessed`; **PATCH on an already-completed assessment edits result in place, no status change, audit includes before/after.** **Plan** `{offeringId, durationMins, classesPerWeek, plannedClasses}`: requires `assessed`; uses `buildPlanSnapshot`; writes plan fields + snapshot, `assessed → plan_agreed`; 400 with the builder's error string on invalid plan; offering must belong to the enrollment's course. **Confirm** `{note?}`: `plan_agreed → enrolled`, audit `enrollment.confirm`.
- [ ] Tuition route: today requires `applicationPaid`; additionally, if status is `plan_agreed` → after recording the payment, `transitionEnrollment(plan_agreed→enrolled)` + audit `enrollment.enrolled_by_tuition`; if status is `assessment_paid|assessment_scheduled|assessed` still allowed (prepay) but does not transition; balance logic unchanged (legacy `Course.pricing`), and when `ratePerClass`/`plannedClasses` exist use `planTotal` as expected total (null-safe for legacy rows).
- [ ] `scripts/mock-paystack.mjs` (tiny `http` server: `POST /transaction/initialize`, `GET /transaction/verify/:ref` → success with `channel:'card'`); `scripts/test-webhook.mjs` extended: with `WEBHOOK_E2E=1` and a DB-seeded pending enrollment + reference, posts a signed `charge.success`, then asserts via `psql`/prisma: status `assessment_paid`, `applicationPaid`, `seatsLeft` unchanged, exactly one `AuditLog enrollment.assessment_paid`; **replays it** and asserts nothing changes; also a cancelled-enrollment case. Default (no env) behaviour is unchanged.
- [ ] Run unit tests + the extended webhook script against ephemeral DB + mock; `tsc`; `next build`.
- [ ] Commit 2.

### Task 3: Admin APIs + locations/offerings/materials UI (commit 3, part A)
**Files:** `app/api/admin/locations/{route,[id]/route}.ts`, `app/api/admin/courses/[id]/offerings/{route,[offeringId]/route,bulk-rate/route}.ts`, `app/api/admin/courses/[id]/materials/{route,[materialId]/route}.ts`, `app/admin/locations/page.tsx`, `components/admin/{location-form-modal,offerings-tab,materials-tab}.tsx`, `components/admin/admin-layout.tsx` (nav "Locations"), `app/admin/courses/[id]/edit/page.tsx` (replace `delivery` tab content with Offerings; add Materials tab; seat inputs get "no longer enforced" note), `app/admin/courses/create/page.tsx` (drop pricing/modes/location inputs; note "configure offerings after saving"), `app/api/admin/courses/route.ts` + `[id]/route.ts` (stop requiring `location/pricing/availableModes`), `app/admin/courses/page.tsx` (list shows offering count instead of location/price).
**Interfaces — Produces (all `withAuth`, JSON, audited):**
```
GET/POST /api/admin/locations                {name, kind, assessmentFee, isActive, order, address?} → Location (slug derived, unique)
GET/PATCH/DELETE /api/admin/locations/[id]   DELETE refused (409) if any offering/enrollment references it → advise deactivate
GET/POST /api/admin/courses/[id]/offerings   POST {locationId, deliveryModeId, classesPerWeekOptions?, isActive?}; 409 on duplicate triple; GET includes rates
PATCH/DELETE …/offerings/[offeringId]        PATCH {isActive?, classesPerWeekOptions?, rates?: [{durationMins, pricePerClass}] (replace-all)}; activating with 0 rates → 400
POST …/offerings/bulk-rate                   {durationMins, pricePerClass, offeringIds?|all:true} upserts that duration's rate on those offerings
GET/POST …/materials, PATCH/DELETE …/[materialId]
```
Audit actions: `location.create|update|delete`, `offering.create|update|delete`, `offering.bulk_rate`, `material.create|update|delete`.
- [ ] Validation helper shared by routes (`pricePerClass`/`assessmentFee`/`price` non-negative ints; `durationMins` ∈ 15..240 int; slug derivation collision-safe).
- [ ] Offerings tab: location × format matrix of cells (not-offered / inactive / active+rates), per-cell dialog for durations (45 and 60 prefilled as quick-add) and per-duration rates, and a **bulk "Set rate for…"** control (duration + price + choose locations/formats → bulk-rate). Active toggle disabled until ≥1 rate.
- [ ] `tsc`; `next build`; browser check at 1280px on ephemeral DB (create a location, an offering, rates, a material; refresh to confirm persistence).

### Task 4: Enrollment pipeline UI + walk-in (commit 3, part B)
**Files:** split `app/admin/enrollments/page.tsx` (740 lines) into `components/admin/enrollments/{enrollment-table,enrollment-filters,status-badge,assessment-plan-panel}.tsx` (page keeps data-fetching + modals); `components/admin/student-registration-modal.tsx`; `app/api/admin/enrollments/route.ts` (walk-in per B7; GET list for admin includes `location`, `offering{deliveryMode}`, latest `assessment`); `app/api/enrollments/route.ts` GET select (stage fields, location).
- [ ] Stage filter chips/select for all 7 statuses (+ legacy values display), keep payment/location filters; `status-badge` knows every status (legacy `enrolled` shows "Enrolled", new stage names human-readable).
- [ ] `assessment-plan-panel` (dialog from a row action "Assessment & plan"): shows arrangement/preferred date+time/address; **Schedule** form (datetime, assessor select from roster, arrangement); **Record/Edit result** form (level, notes, recommended offering; edit allowed after completion); **Agree plan** form (offering select from this course's offerings incl. rates, duration select from that offering's rates, classes/week from options, planned classes; live "₦rate × n = total" preview, labelled as snapshot); **Confirm enrolment** button with a confirm dialog. Buttons enabled only per the guard (reuse `canTransition` client-side). Legacy `enrolled` rows: panel opens read-only with an optional "Add assessment record".
- [ ] Walk-in modal: location select (active locations, kind badge) → course select (courses with an offering at that location, offerable or not) → optional offering/format select; arrangement default CENTRE; preferred date/time optional; "Schedule assessment now" optional datetime; fee shown from the chosen location; `feePaid` + method unchanged. Route per B7 writes `locationId`, `offeringId`, creates `Assessment{requested|scheduled}`, applies `pending→assessment_paid` (+`→assessment_scheduled` if scheduled now, both audited).
- [ ] `tsc`; `next build`; browser check 1280px: walk-in → mark paid → schedule → result → plan → confirm on ephemeral DB; legacy fixture row opens read-only without error (Review Focus 5).
- [ ] Commit 3 (A+B together; two commits acceptable if the diff is large — keep each building).

### Task 5: Public data layer + location-first browse (commit 4, part A)
**Files:** `lib/offerings.ts`, `app/api/locations/route.ts`, `app/api/courses/route.ts`, `app/api/courses/[id]/route.ts`, `components/site/location-chooser.tsx`, `components/site/courses/{course-data,course-card,course-filter-bar,enrol-aside,course-panels}.tsx`, `app/(site)/courses/page.tsx`, `app/(site)/courses/[id]/page.tsx`, `components/site/home/{featured-courses,how-you-learn}.tsx` (only price/format data sources; copy belongs to S1).
**Interfaces — Produces:**
```ts
// lib/offerings.ts
export function offerableOfferingWhere(locationId?: string): Prisma.CourseOfferingWhereInput   // B6
export interface PublicOffering { id; location:{id;name;slug;kind;assessmentFee}; format:string; classesPerWeekOptions:number[]; rates:{durationMins:number;pricePerClass:number}[] }
export async function getPublicOfferings(courseId: string, locationSlug?: string): Promise<PublicOffering[]>
GET /api/locations → {locations:[{id,name,slug,kind,assessmentFee}]} (active only, ordered)
GET /api/courses?location=<slug> → only courses with ≥1 offerable offering there; each course has fromRatePerClass|null
GET /api/courses/[id]?location=<slug> → existing fields + offerings: PublicOffering[]   (legacy pricing/modes/seat fields removed from the payload)
```
- [ ] Tests (Vitest, pure parts): `fromRate` use for card captions; `offerableOfferingWhere` shape asserted (isActive, location.isActive, rates.some). DB-backed behaviour checked in the browser/ephemeral run.
- [ ] `/courses`: chooser (physical + ONLINE-kind side by side) above filters; no location → all published courses, caption "from ₦X per class" if any offerable offering else "Enrolment opening soon" (never a number from legacy `pricing`); with location → only courses offered there. `/courses/[id]`: with `?location` show that location's formats and per-duration rates ("₦X per class · 45 min"); without → chooser first; aside CTA → `/enroll?courseId=&offeringId=`; no total tuition shown anywhere.
- [ ] Course with no offerable offering anywhere: detail page and card show "Enrolment opening soon" with a contact link; no enrol CTA.
- [ ] `tsc`; `next build`.

### Task 6: Enrol wizard + public POST (commit 4, part B)
**Files:** `components/site/enroll/{enroll-wizard,step-format→step-assessment,step-details,step-payment,enroll-summary,enroll-states,types}.tsx`, `app/api/enrollments/route.ts`, `lib/email.ts` + `lib/receipt.ts` (copy), `app/(site)/enroll/success/page.tsx` (copy only).
**Interfaces — Produces:** `POST /api/enrollments` body: existing person/consent fields + `{offeringId, arrangement:'HOME'|'CENTRE'|'ONLINE', preferredDate?, preferredTimeBand?, address?, landmark?}`; **400** if offering not offerable (message "This format is not currently open for enrolment at that location"), **400** if `arrangement` invalid, HOME requires `address`; response keeps `enrollment`/`payment` shape and adds `applicationFee.amount` from `Location.assessmentFee`. Creates `Enrollment{locationId, offeringId, selectedMode=offering format, status:'pending'}` + `Assessment{requested}` (B4).
- [ ] Wizard steps: **1 Assessment** (shows chosen location · format · per-class rate per duration as information; arrangement radio; preferred date + time band; home address/landmark when HOME) → **2 Your details** → **3 Consents + pay assessment fee** (fee amount from API, labelled "Assessment fee, non-refundable"). Remove seat/“full” gate; "no active offering" → `CourseUnavailable` "Enrolment opening soon". `describeServerError` map updated (keep old known strings that still exist).
- [ ] Copy: "application fee"/"registration fee" → "assessment fee" in wizard, aside, success page, `lib/email.ts` templates/subjects, `lib/receipt.ts` PDF (`ASSESSMENT FEE RECEIPT`), admin notice ("new paid assessment application"). `ApplicationFeeReceiptData`/function names unchanged. Do not touch policy files.
- [ ] Tests-by-execution on ephemeral DB + mock Paystack: POST with a non-offerable offering → 400; with an offerable one → 201, row has `locationId/offeringId`, Assessment `requested`, fee equals `Location.assessmentFee` (change the fee in DB, re-POST, amount follows); webhook (mock) → `assessment_paid`; duplicate guard B9.
- [ ] Browser check at **375px and 1280px**: location chooser → course → format → wizard → redirect reaches the mock checkout URL; "opening soon" course shows no price; screenshots saved outside the repo.
- [ ] `tsc`; `next build`; `npm test`. Commit 4.

### Task 7: Docs (commit 5)
- [ ] `docs/sop/assessment-first-admission.md` (house style: What shipped · Why · How · What's involved · Verification · Operate/roll back · Follow-ups). **Operate must state:** snapshot prod first; direct (non-Accelerate) DB URL because `postinstall` runs `migrate deploy`; **all migrated offerings are inactive with no rates, so every course shows "Enrolment opening soon" until rates are entered in `/admin`**; Locations seeded with fee tiers; rollback = restore snapshot (migration is additive, old columns intact, so a code-only revert is also safe). Include B1–B13, the policy-text contradictions list, and what was NOT verified (real Paystack test charge).
- [ ] Tick Streams 2+3 in `docs/checklist/master-checklist.md` (only what is built and verified; mark unproven items `[~]`); update snapshot line; D1 stays SUPERSEDED.
- [ ] `docs/architecture/banafix-blueprint.md`: state machine + data model updates, mark drift (old Course price/location/modes/seats, `application_paid`/`enrolled` meaning).
- [ ] Update `docs/sop/walk-in-registration.md` (location+offering picker, `assessment_paid`, Location fee) and any SOP now stale (`student-entity-foundation.md` status vocabulary note, `enrollment-emails.md`, `tuition-receipts.md` if affected).
- [ ] Policy contradictions to list in SOP + report (do not edit): refund schedule (100%/75%/50% refunds, `policy-dialog.tsx`) vs non-refundable assessment fee; `/policies` "full refund within 14 days… request through your student dashboard" (no dashboard exists); PayPal; instalment plan; "seats" language.

### Task 8: Verification, Opus review, PR
- [ ] Full fast checks: `npx tsc --noEmit`, `npx next build`, `npm test`; re-run `scripts/verify-migration.sh` and webhook E2E from a clean ephemeral DB; record outputs in the log below.
- [ ] **One Opus review** (feature-dev:code-reviewer or equivalent, model opus) over: webhook, `enrollment-status` + `enrollment-transition`, migration SQL, rate snapshot/plan route, tuition→enrolled path. Fix what it finds; log findings + fixes.
- [ ] Verify commits carry no attribution/trailers; branch name; push `HEAD:feature/assessment-first-admission`; open PR against `banafix` (body: no footer); **do not merge**. `get_status` / `bind_pr`.
- [ ] Report (~15 lines): PR, head SHA, verified vs not (real Paystack test charge = NOT done), calls made, questions for John/Adebayo.

## Self-review (against spec)
Data model ✔ T1 · status machine + table + legacy ✔ T2 · webhook/cash/walk-in ✔ T2/T4 · tuition→enrolled + Confirm ✔ T2 · audit ✔ T2/T3 · admin locations/offerings/materials/bulk rate ✔ T3 · stage filters + panel + split ✔ T4 · walk-in ✔ T4 · location-first, ONLINE-kind locations, per-class, opening soon ✔ T5/T6 · wizard arrangement/date + fee from Location ✔ T6 · relabel copy-only ✔ T6 · migration + fixture + inactive offerings ✔ T1 · docs ✔ T7 · Opus review ✔ T8 · seat retirement ✔ T2/T3/T6 (B11). Open business rule (fee once per student vs application): default once per application, noted in SOP.

## Ledger log
- 2026-11-03 — Plan written. Worktree branch `feature/assessment-first-admission-73098e` (to be renamed before first push). `npm ci --ignore-scripts` used (postinstall would migrate prod). S1's Vitest commit not yet on `feature/per-class-copy-and-modules-9e8798` at plan time.
- 2026-11-03 — **Commit 1** `4fe97fc` (T0/T1): schema + staged migration + seed + ephemeral harness. `scripts/verify-migration.sh` 28/28 assertions pass (no row loss, grandfathered statuses, all offerings inactive/no rates, enrollment backfill incl. padded location text, orphan mode skipped, no schema drift). NB: port 5455 (lead's recipe) held foreign tables when first tried, so the harness uses **5466**.
- 2026-11-03 — **Commit 2** `14eb8c6` (T2): guard + CAS + `settleAssessmentFee` + assessment/plan/confirm/cancel routes + tuition->enrolled. `npm test` 45 pass; `tsc` 0; `next build` ok; webhook E2E (mock Paystack, ephemeral DB) all pass incl. replay, 3 concurrent deliveries, cancelled + legacy-enrolled late payments, charge.failed. Found+fixed: second money path `POST /api/enrollments/[id]` (unauthenticated manual verify) still wrote retired `application_paid` + decremented seats; now uses `settleAssessmentFee`. Webhook now rethrows DB errors (was swallowed -> Paystack never retried). Vitest cherry-picked from S1 (`3ce101c`).
- 2026-11-03 — Plan change: `lib/application-fee.ts` deletion moved to T6 (importers are public-site files). Seed gains sample offerings (dev only).
- 2026-11-03 — T3/T4/T5+6 dispatched to three Sonnet implementers (no git writes; lead commits). Rules: scratchpad `subagent-rules.md`.
- 2026-11-03 — Commits 3 `7845c08` (admin), 4 `713a3b2` (public), `e7160eb` (admin-only enrollment reads, from the automated security review), **Opus review** (feature-dev:code-reviewer, opus) → fixes `684e58a`. Findings: migration slug collision (blocker), `application_paid` rows, stale-pending delete losing in-flight payments, unchecked charge amount, tuition status/transaction, receipt consistency, manual-verify POST (deleted), `charge.failed` overwrite, offerable vs delivery mode. Re-verified after fixes: `verify-migration.sh` 33/33, webhook E2E 20/20, `npm test` 68, `tsc` 0, `next build` ok. Not fixed (noted as follow-ups): cash fee during in-flight charge, receipts route auth, stale Seats stat.
- Not verified: real Paystack charge; admin pages at 375px; stage filter in UI; walk-in schedule-now via UI.
- 2026-11-03 (later) — Follow-ups decided by Adebayo, delivered on top of `4a45b46` as fast-forward commits: `33d2762` fee once per student (+ migration `20261103180000`), `66667b5` duplicate fee payments / cash supersedes Paystack / concurrency test, `732c764` policy text + `docs/john-review/policy-changes.md`. Second Opus pass (delta) fixed: stranded pending application (cash mark-paid now covers), covered double-submit race, covered-path abuse (address ignored, no cancelling, throttle). Verified: 84 unit tests, 36 migration assertions, 31 webhook E2E checks, real-Postgres concurrency test (mutation check proves it), `tsc`, `next build`, browser (admin 1280px, covered wizard state 375px). Incident: a Wave 2 session reused `scripts/dev/ephemeral-pg.sh` with the same default data dir and its `reset` wiped my scratch DB mid-run; the script's data dir is now per port.
- 2026-11-03 (night) — Independent review of PR #12 fixed on top of `9d10d08` (no migration touched): H1 (`requested_amount`, admin email), M1 (live pending application takes a fee paid in a cancelled tab), M3 (covered applications `pending` + admin confirm, identical response shape, generic success page), L1/L2/L6/L9/L10, M2 runbook in the SOP. Verified: `tsc`, 89 unit tests, webhook E2E 33 checks (run twice), real-Postgres concurrency script (incl. two-tab cases), `next build`, browser at 375px for the generic received page. Skipped with reasons: L4 (migrations off limits), L7, L8 (follow-ups). Another session's mock Paystack on :4010 died mid-run once; the E2E now uses a fake client IP per run so the new throttle does not trip on reruns.
