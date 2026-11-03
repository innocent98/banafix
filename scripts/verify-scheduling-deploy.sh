#!/usr/bin/env bash
# Proves how 20261103170000_scheduling lands in production, on THROWAWAY Postgres only (127.0.0.1, own port).
#  (a) the full migration chain from an EMPTY database via `prisma migrate deploy`
#  (b) production simulation: every migration EXCEPT scheduling is applied first (as production has them),
#      realistic data is loaded, then `prisma migrate deploy` must apply scheduling on top, although it sorts
#      before already-applied migrations. Never touches .env / production.
#   EPHEMERAL_PG_PORT=5473 scripts/verify-scheduling-deploy.sh
set -euo pipefail
cd "$(dirname "$0")/.."
NEW="20261103170000_scheduling"
PORT="${EPHEMERAL_PG_PORT:-5473}"
export EPHEMERAL_PG_PORT="$PORT" EPHEMERAL_PG_DIR="${TMPDIR:-/tmp}/banafix-sched-deploy-pg"
HOLD="$(mktemp -d)"
restore() { [ -d "$HOLD/$NEW" ] && [ ! -d "prisma/migrations/$NEW" ] && mv "$HOLD/$NEW" "prisma/migrations/$NEW"; scripts/dev/ephemeral-pg.sh stop >/dev/null 2>&1 || true; }
trap restore EXIT
URL="$(scripts/dev/ephemeral-pg.sh reset)"
case "$URL" in *127.0.0.1*) ;; *) echo "refusing: not local" >&2; exit 1;; esac
export DATABASE_URL="$URL"
Q() { psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -At -c "$1"; }
fail=0
check() { if [ "$2" = "$3" ]; then echo "  ✅ $1 ($3)"; else echo "  ❌ $1: expected '$2', got '$3'"; fail=1; fi; }
diff_empty() { npx prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --script 2>/dev/null | grep -v "^$" | grep -v "Loaded Prisma" | tr -d '\n' || true; }

echo "(a) full chain from an EMPTY database"
npx prisma migrate deploy 2>&1 | grep -E "migrations? found|applied|Error" | tail -3
check "all migrations recorded as finished" "0" "$(Q "select count(*) from _prisma_migrations where finished_at is null or rolled_back_at is not null")"
check "scheduling is in the chain" "1" "$(Q "select count(*) from _prisma_migrations where migration_name='$NEW'")"
npx prisma migrate status 2>&1 | grep -q "Database schema is up to date" && echo "  ✅ migrate status: up to date" || { echo "  ❌ migrate status not up to date"; fail=1; }
check "no schema drift (empty-DB chain)" "-- This is an empty migration." "$(diff_empty)"
check "exclusion constraints present" "3" "$(Q "select count(*) from pg_constraint where contype='x' and conrelid in ('class_sessions'::regclass,'instructor_availability'::regclass)")"

echo "(b) production simulation"
scripts/dev/ephemeral-pg.sh reset >/dev/null
mv "prisma/migrations/$NEW" "$HOLD/$NEW"
npx prisma migrate deploy 2>&1 | grep -E "migrations? found|Error" | tail -2
check "scheduling is NOT applied yet (as in production)" "0" "$(Q "select count(*) from _prisma_migrations where migration_name='$NEW'")"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -f scripts/fixtures/prod-like-pre-scheduling.sql
b_instr=$(Q 'select count(*) from instructors'); b_course=$(Q 'select count(*) from courses'); b_enr=$(Q 'select count(*) from enrollments')
b_stu=$(Q 'select count(*) from students'); b_status=$(Q "select string_agg(id||':'||status, ',' order by id) from enrollments")
b_days=$(Q "select string_agg(id||':'||coalesce(array_to_string(\"preferredDays\",'|'),'-'), ',' order by id) from enrollments")
b_primary=$(Q "select string_agg(id||':'||coalesce(\"instructorId\",'-'), ',' order by id) from courses")
b_last=$(Q "select migration_name from _prisma_migrations order by finished_at desc limit 1")
echo "  last applied before scheduling: $b_last (scheduling sorts before it)"
mv "$HOLD/$NEW" "prisma/migrations/$NEW"
echo "  prisma migrate deploy with scheduling pending:"
npx prisma migrate deploy 2>&1 | grep -E "migrations? found|Applying|applied|Error|P30" | sed 's/^/    /'
check "scheduling applied and finished" "1" "$(Q "select count(*) from _prisma_migrations where migration_name='$NEW' and finished_at is not null and rolled_back_at is null")"
check "no failed/rolled-back migration rows" "0" "$(Q "select count(*) from _prisma_migrations where finished_at is null or rolled_back_at is not null")"
check "btree_gist installed" "btree_gist" "$(Q "select extname from pg_extension where extname='btree_gist'")"
check "3 exclusion constraints present" "3" "$(Q "select count(*) from pg_constraint where contype='x' and conrelid in ('class_sessions'::regclass,'instructor_availability'::regclass)")"
check "partial unique index present" "1" "$(Q "select count(*) from pg_indexes where indexname='class_sessions_slot_unique'")"
check "no instructor lost" "$b_instr" "$(Q 'select count(*) from instructors')"
check "no course lost" "$b_course" "$(Q 'select count(*) from courses')"
check "no enrollment lost" "$b_enr" "$(Q 'select count(*) from enrollments')"
check "no student lost" "$b_stu" "$(Q 'select count(*) from students')"
check "enrollment statuses untouched" "$b_status" "$(Q "select string_agg(id||':'||status, ',' order by id) from enrollments")"
check "legacy preferredDays untouched ('Monday' etc.)" "$b_days" "$(Q "select string_agg(id||':'||coalesce(array_to_string(\"preferredDays\",'|'),'-'), ',' order by id) from enrollments")"
check "Course.instructorId untouched (public /tutors)" "$b_primary" "$(Q "select string_agg(id||':'||coalesce(\"instructorId\",'-'), ',' order by id) from courses")"
check "InstructorCourse backfilled from the primary instructors (3 courses have one)" "c1:i1,c2:i1,c3:i2" "$(Q "select string_agg(\"courseId\"||':'||\"instructorId\", ',' order by \"courseId\") from instructor_courses")"
check "new preference columns default empty on existing rows" "0" "$(Q "select count(*) from enrollments where cardinality(\"preferredTimeBands\") <> 0 or \"preferredFromTime\" is not null or \"preferredClassesPerWeek\" is not null")"
check "no sessions or availability yet" "0" "$(Q 'select (select count(*) from class_sessions)+(select count(*) from instructor_availability)')"
npx prisma migrate status 2>&1 | grep -q "Database schema is up to date" && echo "  ✅ migrate status: up to date" || { echo "  ❌ migrate status not up to date"; fail=1; }
check "no schema drift (production simulation)" "-- This is an empty migration." "$(diff_empty)"
# the constraint actually works on the migrated database (a real booking, then a clash)
Q "insert into class_sessions (id,\"enrollmentId\",\"studentId\",\"instructorId\",mode,\"startsAt\",\"durationMins\",\"endsAt\",status,sequence,\"updatedAt\") values ('k1','e2','s2','i1','CENTRE','2030-01-07 09:00+01',60,'2030-01-07 10:00+01','scheduled',1,now())" >/dev/null
out=$(psql "$DATABASE_URL" -At -c "insert into class_sessions (id,\"enrollmentId\",\"studentId\",\"instructorId\",mode,\"startsAt\",\"durationMins\",\"endsAt\",status,sequence,\"updatedAt\") values ('k2','e1','s1','i1','CENTRE','2030-01-07 09:30+01',45,'2030-01-07 10:15+01','scheduled',1,now())" 2>&1 || true)
echo "$out" | grep -q class_sessions_instructor_no_overlap && echo "  ✅ overlapping booking rejected on the migrated database" || { echo "  ❌ overlap not rejected: $out"; fail=1; }

if [ "$fail" = 0 ]; then echo "ALL DEPLOY PROOFS PASSED"; else echo "DEPLOY PROOF FAILED"; exit 1; fi
