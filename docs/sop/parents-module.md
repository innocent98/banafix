# SOP — Parent records + child mapping (req #3)

## What shipped
A `Parent` entity and admin UI to create/edit/delete parents and map each to one or more
**enrolled students** (children). Branch `parents-module` (off `banafix`; independent of the
tuition/edit-student PRs).

## Why
The academy needs parent/guardian records (name, email, phone, address, birthday) linked to their
children, both for contact and to power birthday messages (req #4). A parent can have several
children; a child can have multiple guardians.

## How (key decisions)
- **`Parent` model** (`prisma/schema.prisma`): `name`, `email @unique`, `phone?`, `address?`,
  `birthdayMonth?` (1-12), `birthdayDay?` (1-31, **month+day only, no year**), timestamps.
- **Many-to-many** `Parent.children` ↔ `Student.parents` (Prisma implicit relation
  `"ParentChildren"` → join table `_ParentChildren`). Additive migration only (new `parents` table
  + join table + FKs); zero impact on existing data.
- **Child picker = enrolled students only:** `GET /api/admin/students?q=` returns students with at
  least one `status='enrolled'` enrollment, matching "map from our enrolled students records."
- **Email unique** on parents (editable, unlike the immutable student email). Duplicate → 409.
- **Birthday validation:** both month and day, or neither; ranges enforced (1-12 / 1-31).
- **Audit:** `parent.create` / `parent.update` / `parent.delete` via `logAdminAction`.
- Deleting a parent does not delete children (join rows cascade-removed only).

## What's involved (files)
- `prisma/schema.prisma` + `prisma/migrations/20260901082310_add_parents/migration.sql` (new).
- `app/api/admin/parents/route.ts` — `GET` (list, `?q=` search) + `POST` (create).
- `app/api/admin/parents/[id]/route.ts` — `GET` / `PATCH` (edit + replace child set) / `DELETE`.
- `app/api/admin/students/route.ts` — `GET ?q=` enrolled-student search for the picker.
- `components/admin/parent-form-modal.tsx` — create/edit form with a searchable child multi-select.
- `app/admin/parents/page.tsx` — parents list + add/edit/delete.
- `components/admin/admin-layout.tsx` — "Parents" nav item.

## Verification
- Migration authored + applied on an **ephemeral Postgres 16**; SQL confirmed additive (no `DROP`).
- Relation round-trip **verified on scratch**: one parent ↔ 2 children, child sees 1 parent,
  duplicate email blocked (unique), detach works.
- `npx tsc --noEmit` → 0 errors · `npm run build` → succeeds.
- **Not verified live:** the HTTP routes (auth + full request cycle) are covered by types + build,
  not an end-to-end authed run. Audit writes are best-effort.

## Follow-ups
- req #4 (birthdays) consumes `Parent.birthdayMonth`/`birthdayDay` + `Student.dateOfBirth`.
- Consider a month `<select>` (Jan–Dec) instead of a numeric input for nicer UX.
