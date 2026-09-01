# SOP — Edit student record (req #2)

## What shipped
Admins can edit a student's record from the enrollments page: names, phone, date of birth,
address, landmark, and guardian details. **Email is immutable.** Branch `student-edit` (stacked on
`tuition-receipts`).

## Why
Admins needed to correct/enrich student data (e.g. add DOB and address) after enrollment. Since
the Student entity is the canonical person, one edit reflects across all that person's courses.

## How (key decisions)
- **Edit the person, not the enrollment:** `PATCH /api/admin/students/[id]` (+ a `GET` to prefill
  the form). Editing updates the `Student`, so it shows on every enrollment they have.
- **Email immutable:** the endpoint whitelists only mutable fields; `email`/`id` are never in the
  update payload, and an attempt to send a *different* email is rejected with a 400 (the UI shows
  email as a disabled field, so it never sends one).
- **Audit:** every edit writes an `AuditLog` (`action: 'student.update'`, `metadata.changedFields`).
- **Required names:** `firstName`/`lastName` can't be blanked; optional string fields normalize
  empty → `null`.
- **O4 reconciliation (behavior change):** the enrollment-create flow previously *refreshed* an
  existing student's fields from the form on every re-enrollment (Foundation's O4, deferred to this
  module). That's now removed — the upsert `update` is a no-op, so **a re-enrollment can no longer
  silently overwrite an admin edit**. The edit screen is the source of truth. Tradeoff: a returning
  student's new contact details won't auto-update from the enrollment form; an admin updates them.

## What's involved (files)
- `app/api/admin/students/[id]/route.ts` (new) — `GET` (prefill) + `PATCH` (edit, email immutable,
  audit).
- `components/admin/student-edit-modal.tsx` (new) — edit form; fetches fresh on open; email shown
  disabled; never sends email.
- `app/admin/enrollments/page.tsx` — "Edit student" (pencil) action per row + modal wiring; refresh
  list on save; `student.id` added to the row type.
- `app/api/enrollments/route.ts` — O4: upsert `update` changed to `{}` (no re-enroll overwrite).

## Verification
- `npx tsc --noEmit` → 0 errors · `npm run build` → succeeds.
- PATCH field-processing logic verified via a harness: rejects email change, allows same email
  (case/space-insensitive), updates fields, never writes email, rejects blank required names,
  parses DOB to a Date, normalizes blank optionals to null, tracks changed fields.
- **Not verified live:** a full DB-integration run (PATCH against a seeded student + audit-row
  assertion) was not executed here; covered by types + build + the logic harness. Audit-row writes
  are best-effort (never throw).

## Follow-ups
- If a returning student's contact info commonly changes, consider a "fill blanks only" refresh on
  re-enroll (capture new info without clobbering edits) — deliberately omitted now for simplicity.
- Surface the audit log in the admin UI (still recorded-only across the app).
