#!/usr/bin/env bash
# Proves the assessment-first migration on a THROWAWAY Postgres with a legacy-data fixture.
# Refuses to run unless DATABASE_URL points at 127.0.0.1 (never production).
#   scripts/verify-migration.sh
set -euo pipefail
cd "$(dirname "$0")/.."

PREV="20260902114015_instructor_roster"
NEW="20261103150000_assessment_first_admission"

URL="$(EPHEMERAL_PG_PORT=5467 EPHEMERAL_PG_DIR="${TMPDIR:-/tmp}/banafix-verify-pg" scripts/dev/ephemeral-pg.sh reset)"
export DATABASE_URL="$URL"
case "$DATABASE_URL" in *127.0.0.1*) ;; *) echo "refusing: DATABASE_URL is not local" >&2; exit 1;; esac
Q() { psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -At -c "$1"; }

fail=0
check() { # name expected actual
  if [ "$2" = "$3" ]; then echo "  ✅ $1 ($3)"; else echo "  ❌ $1: expected '$2', got '$3'"; fail=1; fi
}

echo "1) apply migrations up to $PREV (legacy schema)"
for d in prisma/migrations/*/; do
  n=$(basename "$d"); [ "$n" = "$NEW" ] && continue
  [[ "$n" > "$NEW" ]] && continue # later migrations are applied after the assertions (step 4b)
  [ -f "$d/migration.sql" ] && psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -f "$d/migration.sql" >/dev/null
done

echo "2) load legacy fixture"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -f scripts/fixtures/legacy-data.sql >/dev/null
before_courses=$(Q 'select count(*) from courses'); before_enr=$(Q 'select count(*) from enrollments')
before_stu=$(Q 'select count(*) from students'); before_ap=$(Q 'select count(*) from application_payments')
before_tp=$(Q 'select count(*) from tuition_payments'); before_dm=$(Q 'select count(*) from delivery_modes')
before_status=$(Q "select string_agg(id||':'||status, ',' order by id) from enrollments")
before_pricing=$(Q "select string_agg(id||':'||pricing::text||':'||location, ',' order by id) from courses")

echo "3) apply $NEW"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "prisma/migrations/$NEW/migration.sql" 2>&1 | grep -E "NOTICE|ERROR" || true

echo "4) assertions"
check "no course lost"            "$before_courses" "$(Q 'select count(*) from courses')"
check "no enrollment lost"        "$before_enr"     "$(Q 'select count(*) from enrollments')"
check "no student lost"           "$before_stu"     "$(Q 'select count(*) from students')"
check "no application payment lost" "$before_ap"    "$(Q 'select count(*) from application_payments')"
check "no tuition payment lost"   "$before_tp"      "$(Q 'select count(*) from tuition_payments')"
check "no delivery mode lost"     "$before_dm"      "$(Q 'select count(*) from delivery_modes')"
expected_status="${before_status//e_apppaid:application_paid/e_apppaid:enrolled}"
check "enrollment statuses unchanged (grandfathered); application_paid -> enrolled" "$expected_status" "$(Q "select string_agg(id||':'||status, ',' order by id) from enrollments")"
check "no application_paid status left" "0" "$(Q "select count(*) from enrollments where status='application_paid'")"
check "deprecated Course pricing/location untouched"  "$before_pricing" "$(Q "select string_agg(id||':'||pricing::text||':'||location, ',' order by id) from courses")"
check "8 seed locations + Kano + Port-Harcourt + non-ASCII + International" "12" "$(Q 'select count(*) from locations')"
check "slugs are unique" "0" "$(Q 'select count(*) from (select slug from locations group by slug having count(*)>1) d')"
check "colliding slug gets a suffix (Port Harcourt keeps the base)" "port-harcourt,port-harcourt-2" "$(Q "select string_agg(slug, ',' order by slug) from locations where slug like 'port-harcourt%'")"
check "all-non-ASCII name gets a non-empty slug" "1" "$(Q "select count(*) from locations where name='ÀÈÌ' and slug <> ''")"
check "International is ONLINE kind, fee 8000" "ONLINE:8000" "$(Q "select kind::text||':'||\"assessmentFee\" from locations where name='International'")"
check "no duplicate ONDO row from padded text" "1" "$(Q "select count(*) from locations where lower(name)='ondo'")"
check "Lagos fee 5000"            "5000" "$(Q "select \"assessmentFee\" from locations where name='Lagos'")"
check "Online fee 5000"           "5000" "$(Q "select \"assessmentFee\" from locations where name='Online'")"
check "Diaspora fee 8000"         "8000" "$(Q "select \"assessmentFee\" from locations where name='Diaspora'")"
check "Ondo fee 2000"             "2000" "$(Q "select \"assessmentFee\" from locations where name='Ondo'")"
check "Kano (unlisted) fee 2000"  "2000" "$(Q "select \"assessmentFee\" from locations where name='Kano'")"
check "Online/Diaspora are ONLINE kind" "ONLINE,ONLINE" "$(Q "select string_agg(kind::text, ',') from locations where name in ('Online','Diaspora')")"
check "slug of Port Harcourt"     "port-harcourt" "$(Q "select slug from locations where name='Port Harcourt'")"
# lagos 2 + online 1 + ondo 1 (Masterclass skipped) + kano 1 + port-harcourt 1 + non-ascii 1 + intl 1 ('online' case-variant matched) = 8; empty-location course 0
check "offerings created (orphan mode skipped, case-variant mode matched)" "8" "$(Q 'select count(*) from course_offerings')"
check "ALL offerings inactive"    "0" "$(Q 'select count(*) from course_offerings where "isActive"')"
check "NO rates created"          "0" "$(Q 'select count(*) from offering_rates')"
check "default classes/week options [1,2]" "1" "$(Q "select count(distinct \"classesPerWeekOptions\"::text) from course_offerings where \"classesPerWeekOptions\"='{1,2}'")"
check "only the empty-location enrollment has NULL locationId" "e_noloc" "$(Q 'select string_agg(id, $$,$$) from enrollments where "locationId" is null')"
check "padded ' ONDO ' enrollment -> Ondo"  "Ondo" "$(Q "select l.name from enrollments e join locations l on l.id=e.\"locationId\" where e.id='e_ondo'")"
check "enrollment offering backfilled (Lagos On-site)" "On-site" "$(Q "select dm.name from enrollments e join course_offerings o on o.id=e.\"offeringId\" join delivery_modes dm on dm.id=o.\"deliveryModeId\" where e.id='e_paid'")"
check "orphan-mode enrollment has NULL offering" "" "$(Q "select \"offeringId\" from enrollments where id='e_ondo'")"
check "plan fields null for legacy rows" "0" "$(Q 'select count(*) from enrollments where "ratePerClass" is not null or "plannedClasses" is not null')"
check "new Course can omit deprecated columns" "1" "$(Q "with i as (insert into courses (id,title,instrument,level,\"updatedAt\") values ('c_new','T','Guitar','Beginner',now()) returning 1) select count(*) from i")"

echo "4b) apply every LATER migration on top (additive follow-ups) and re-check the data survived"
for d in prisma/migrations/*/; do
  n=$(basename "$d"); [[ "$n" > "$NEW" ]] || continue
  [ -f "$d/migration.sql" ] && psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -f "$d/migration.sql" >/dev/null && echo "  applied $n"
done
check "later migrations keep every enrollment" "$before_enr" "$(Q 'select count(*) from enrollments')"
check "legacy payments untouched by later migrations (still completed)" "1" "$(Q "select count(*) from application_payments where status='completed'")"
check "no enrollment is fee-covered by backfill (coverage link NULL for legacy rows)" "0" "$(Q 'select count(*) from enrollments where "feeCoveredByPaymentId" is not null')"

echo "5) prisma agrees the migration history matches schema.prisma"
drift=$(npx prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --script 2>/dev/null | grep -v "^$" | grep -v "Loaded Prisma" | tr -d '\n' || true)
check "no schema drift after migration" "-- This is an empty migration." "$drift"

EPHEMERAL_PG_PORT=5467 EPHEMERAL_PG_DIR="${TMPDIR:-/tmp}/banafix-verify-pg" scripts/dev/ephemeral-pg.sh stop
if [ "$fail" = 0 ]; then echo "ALL MIGRATION ASSERTIONS PASSED"; else echo "MIGRATION VERIFICATION FAILED"; exit 1; fi
