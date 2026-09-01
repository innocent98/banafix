# SOP — Birthday automation (req #4)

## What shipped
A daily job that emails a professional "happy birthday" message to students (on their date of
birth) and parents (on their stored month+day), idempotently. Branch `birthday-automation`.

## Why
Collecting birthdays was the point of storing DOB (students) and month/day (parents) — this gives
students and parents a sense of belonging with a personal touch on their day.

## How (key decisions)
- **Scheduler = Vercel Cron** (D4): `vercel.json` runs `GET /api/cron/birthdays` at `0 5 * * *`
  (05:00 UTC = **06:00 Africa/Lagos**).
- **Auth:** the endpoint requires `Authorization: Bearer $CRON_SECRET` (Vercel sends this
  automatically when `CRON_SECRET` is set). No secret set → 500; wrong/missing → 401.
- **"Today" is computed in Africa/Lagos** (`todayInLagos`, `Intl.DateTimeFormat` tz). Student DOB
  is matched on **UTC month+day** (DOB is a date-only value); parents match on stored
  `birthdayMonth`/`birthdayDay`.
- **Idempotency:** new `BirthdayEmailLog` model, unique `(recipientType, recipientId, year)`. A row
  is written **only after a successful send**, so a failed send retries next run but a success is
  never repeated within the year. Additive migration.
- **Reusable core** `lib/birthdays.ts` (`collectBirthdayRecipients`, `todayInLagos`) is kept out of
  the route file (Next.js route files may only export handlers) and is directly testable.
- **Audit:** each run writes a `birthday.run` `AuditLog` with `{candidates, sent, failed}`.

## What's involved (files)
- `prisma/schema.prisma` + `prisma/migrations/20260901092557_add_birthday_email_log/migration.sql`.
- `lib/birthdays.ts` — recipient collection + tz helper.
- `app/api/cron/birthdays/route.ts` — guarded `GET` handler (send + log).
- `lib/email.ts` — `sendBirthdayEmail` (student & parent variants).
- `vercel.json` — cron schedule.

## Verification
- Migration applied on an **ephemeral Postgres**; additive (no `DROP`).
- `collectBirthdayRecipients` **verified on scratch**: matches the right student (DOB month/day) +
  parent, excludes non-matching, and **dedups** a recipient already logged for the year (2 → 1 on
  re-run after a log row).
- `npx tsc --noEmit` → 0 · `npm run build` → succeeds.
- **Email delivery NOT verified** — `RESEND_API_KEY` is still a placeholder (401). The send path is
  built and its selection/dedup logic proven, but no mail actually goes out until a real Resend key
  + verified `banafix.com` domain are configured.

## Operate
- Set **`CRON_SECRET`** in the Vercel project (required; the endpoint 401s without a match).
- Set a real **`RESEND_API_KEY`** and verify the sender domain for mail to actually send.
- Vercel Cron only runs on production deployments.

## Follow-ups
- Optional: page in the admin UI to view upcoming birthdays / resend.
- If the student/parent list grows large, replace the "fetch-all-DOB-then-filter" with a raw
  `EXTRACT(MONTH/DAY)` query.
