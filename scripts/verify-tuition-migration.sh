#!/usr/bin/env bash
# Proves the per-class tuition migration on a THROWAWAY Postgres with a legacy-data fixture.
# Refuses to run unless DATABASE_URL points at 127.0.0.1 (never production).
#   scripts/verify-tuition-migration.sh
set -euo pipefail
cd "$(dirname "$0")/.."

NEW="20261103180000_per_class_tuition"

URL="$(EPHEMERAL_PG_PORT=5481 EPHEMERAL_PG_DIR="${TMPDIR:-/tmp}/banafix-verify-tuition-pg" scripts/dev/ephemeral-pg.sh reset)"
export DATABASE_URL="$URL"
case "$DATABASE_URL" in *127.0.0.1*) ;; *) echo "refusing: DATABASE_URL is not local" >&2; exit 1;; esac
Q() { psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -At -c "$1"; }
fail=0
check() { if [ "$2" = "$3" ]; then echo "  ✅ $1 ($3)"; else echo "  ❌ $1: expected '$2', got '$3'"; fail=1; fi; }

echo "1) apply all migrations before $NEW"
for d in prisma/migrations/*/; do
  n=$(basename "$d"); [ "$n" = "$NEW" ] && continue
  [ -f "$d/migration.sql" ] && psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -f "$d/migration.sql" >/dev/null 2>&1
done

echo "2) legacy fixture + agreed-plan rows (as Streams 2+3 would have left them)"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -f scripts/fixtures/legacy-data.sql >/dev/null
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q <<'SQL' >/dev/null
INSERT INTO enrollments (id, "courseId", "studentId", "selectedMode", status, "applicationPaid", "durationMins", "classesPerWeek", "plannedClasses", "ratePerClass", "updatedAt") VALUES
  ('e_plan_agreed',   'c_online_pno', 's1', 'Online', 'plan_agreed', true, 60,   2, 8, 4000, now()),
  ('e_plan_enrolled', 'c_ondo_drm',   's2', 'Online', 'enrolled',    true, NULL, 1, 4, 3000, now()),
  ('e_plan_cancel',   'c_kano_vox',   's3', 'Online', 'cancelled',   true, 60,   1, 4, 3000, now()),
  ('e_plan_zero',     'c_lagos_gtr',  's3', 'Online', 'plan_agreed', true, 60,   1, 0, 3000, now());
INSERT INTO tuition_payments (id, "enrollmentId", amount, "paymentMethod", status, "paidAt", "receiptNumber", "updatedAt") VALUES
  ('tp_plan', 'e_plan_enrolled', 3000, 'cash', 'completed', now(), 'TUI-plan-1', now());
SQL
Q "select string_agg(id||':'||status||':'||coalesce(\"ratePerClass\"::text,'-')||':'||coalesce(\"plannedClasses\"::text,'-'), ',' order by id) from enrollments" > /tmp/.s5_enr_before
before_enr=$(cat /tmp/.s5_enr_before); rm -f /tmp/.s5_enr_before
before_tp=$(Q "select string_agg(id||':'||amount||':'||status, ',' order by id) from tuition_payments")
before_cnt=$(Q 'select count(*) from enrollments')

echo "3) apply $NEW"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "prisma/migrations/$NEW/migration.sql" 2>&1 | grep -E "NOTICE|ERROR" || true

echo "4) assertions"
check "enrollments unchanged (status + plan fields)" "$before_enr" "$(Q "select string_agg(id||':'||status||':'||coalesce(\"ratePerClass\"::text,'-')||':'||coalesce(\"plannedClasses\"::text,'-'), ',' order by id) from enrollments")"
check "no enrollment lost" "$before_cnt" "$(Q 'select count(*) from enrollments')"
check "existing tuition payments untouched (new columns null)" "$before_tp" "$(Q "select string_agg(id||':'||amount||':'||status, ',' order by id) from tuition_payments")"
check "existing payments have null paystack columns" "0" "$(Q 'select count(*) from tuition_payments where "paystackReference" is not null or "paymentUrl" is not null or "paystackChannel" is not null')"
check "legacy enrollments get NO charge" "0" "$(Q "select count(*) from tuition_charges where \"enrollmentId\" in ('e_paid','e_pending','e_online','e_ondo','e_kano','e_apppaid','e_noloc')")"
check "plan_agreed plan row: one CLASSES charge 8 x 4000 origin PLAN" "1:CLASSES:PLAN:8:4000:8 x 60-minute classes" "$(Q "select count(*)||':'||min(kind)||':'||min(origin)||':'||min(quantity)||':'||min(\"unitPrice\")||':'||min(description) from tuition_charges where \"enrollmentId\"='e_plan_agreed'")"
check "enrolled plan row (no duration): 4 x 3000 'classes' wording" "1:4:3000:4 classes" "$(Q "select count(*)||':'||min(quantity)||':'||min(\"unitPrice\")||':'||min(description) from tuition_charges where \"enrollmentId\"='e_plan_enrolled'")"
check "balance preserved: charge total 12000 - paid 3000" "9000" "$(Q "select (select sum(quantity*\"unitPrice\") from tuition_charges where \"enrollmentId\"='e_plan_enrolled') - (select sum(amount) from tuition_payments where \"enrollmentId\"='e_plan_enrolled')")"
check "cancelled row not backfilled" "0" "$(Q "select count(*) from tuition_charges where \"enrollmentId\"='e_plan_cancel'")"
check "zero planned classes not backfilled" "0" "$(Q "select count(*) from tuition_charges where \"enrollmentId\"='e_plan_zero'")"
check "backfilled charge predates the enrollment's payments" "t" "$(Q "select bool_and(c.\"createdAt\" <= p.\"createdAt\") from tuition_charges c join tuition_payments p on p.\"enrollmentId\"=c.\"enrollmentId\"")"

echo "5) re-running the backfill is a no-op"
before=$(Q 'select count(*) from tuition_charges')
sed -n '/Part 2: backfill/,$p' "prisma/migrations/$NEW/migration.sql" | psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q >/dev/null 2>&1
check "charge count unchanged on re-run" "$before" "$(Q 'select count(*) from tuition_charges')"

echo "6) schema drift"
if npx prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --exit-code >/dev/null 2>&1; then
  echo "  ✅ no drift between migrations and schema.prisma"
else
  echo "  ❌ drift detected"; fail=1
fi

EPHEMERAL_PG_PORT=5481 EPHEMERAL_PG_DIR="${TMPDIR:-/tmp}/banafix-verify-tuition-pg" scripts/dev/ephemeral-pg.sh stop
[ "$fail" = 0 ] && echo "ALL OK" || { echo "FAILURES"; exit 1; }
