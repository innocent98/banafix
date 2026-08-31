# Banafix — Master Build Checklist

Single source of truth for what's done, in progress, and ahead. An item is checked **only when
built and verified**. See [`docs/architecture/banafix-blueprint.md`](../architecture/banafix-blueprint.md) for the full map.

**Snapshot (2026-08-31):** Modules — ✅ 3 done · 🟡 1 partial · 🔵 5 planned

Legend: `[x]` done+verified · `[~]` shipped-but-unproven (note why) · `[ ]` not started

---

## ✅ Enrollment & application-fee payment
- [x] Enrollment form + validation (`/enroll`, `POST /api/enrollments`)
- [x] Location-based application fee (`lib/application-fee.ts`)
- [x] Paystack init → redirect → `/enroll/success` verify
- [x] Duplicate-enrollment guard + stale-pending cleanup
- [x] Webhook `charge.success` → `application_paid` + seat decrement (signature path 🟢 verified)

## ✅ Enrollment emails
- [x] "Application received" ack on submit
- [x] Paid receipt + PDF to student (webhook)
- [x] Admin "new paid enrollment" notice (webhook)
- [x] Local test harnesses (`test:webhook` 🟢 passing, `test:emails` ready)
- [~] **Real delivery** — blocked: `RESEND_API_KEY` is a placeholder; verify `banafix.com` sender domain in Resend

## ✅ Admin — courses & enrollments (view)
- [x] Admin auth (JWT) + course CRUD, curriculum, FAQs, instructor, image upload (Vercel Blob)
- [x] Enrollments list/detail + status badges + tuition recording
- [x] Tuition payment → student receipt + PDF

---

## 🟡 Tuition payments — receipt & balance  *(req #1)*
- [x] Student receipt on record (already shipped)
- [ ] Admin copy of every tuition receipt → `ADMIN_EMAIL`/`SUPPORT_EMAIL`
- [ ] Full vs partial marker per payment (`completed` | `partial`)
- [ ] Balance-remaining calc + display on receipt & admin table — **needs D3** (expected-total source)
- [ ] Verify: record partial → correct balance → both emails arrive

## 🔵 Edit student record  *(req #2)*
- [ ] `PATCH /api/admin/enrollments/[id]` (JWT) — editable fields, **email immutable**
- [ ] Admin edit UI (DOB, address, guardian, preferences)
- [ ] Writes `AuditLog` on each edit
- [ ] Verify: email cannot be changed; other fields persist

## 🔵 Parent records + child mapping  *(req #3)*
- [ ] **D2 decided** (introduce `Student` entity vs enrollment-as-student)
- [ ] `Parent` model (name, email, phone, address, birthday month+day) + migration
- [ ] Many-to-many parent ↔ children
- [ ] Admin UI: create parent, attach one/more enrolled students
- [ ] Verify: one parent ↔ multiple children maps and reads back

## 🔵 Birthday automation  *(req #4)*
- [ ] **D4 decided** (Vercel Cron recommended)
- [ ] `vercel.json` cron + `GET /api/cron/birthdays` guarded by `CRON_SECRET`
- [ ] Birthday email templates (student + parent) in `lib/email.ts`
- [ ] Today-in-Africa/Lagos match for students (full DOB) + parents (month+day)
- [ ] Dedup so nobody gets two emails
- [ ] Verify: seeded birthday → exactly one email per person on the day

## 🔵 Admin audit log  *(NB)*
- [ ] `AuditLog` model + migration
- [ ] `logAdminAction()` helper wired into admin mutations
- [ ] Recorded (not exposed in UI yet)
- [ ] Verify: tuition record / student edit / parent CRUD each leave a log row

---

## Backlog / upcoming
- [ ] **D1** — define `enrolled` behaviour (dead status today; see blueprint §8)
- [ ] **D5** — harden public enrollment read endpoints behind admin auth
- [ ] Student dashboard + online tuition payment — *explicitly out of scope for now*

## Deferred follow-ups
- [ ] Auto-send wiring parity review across all receipt types
- [ ] Confirm `FROM_EMAIL` domain verified in Resend before production
