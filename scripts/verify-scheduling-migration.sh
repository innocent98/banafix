#!/usr/bin/env bash
# Proves the scheduling migration on a THROWAWAY Postgres (default port 5470) loaded with the legacy fixture.
# Refuses to run unless the DB is 127.0.0.1 (never production).
#   scripts/verify-scheduling-migration.sh
set -euo pipefail
cd "$(dirname "$0")/.."

NEW="20261103170000_scheduling"
PORT="${EPHEMERAL_PG_PORT:-5470}"
URL="$(EPHEMERAL_PG_PORT=$PORT EPHEMERAL_PG_DIR="${TMPDIR:-/tmp}/banafix-sched-pg" scripts/dev/ephemeral-pg.sh reset)"
export DATABASE_URL="$URL"
case "$DATABASE_URL" in *127.0.0.1*) ;; *) echo "refusing: DATABASE_URL is not local" >&2; exit 1;; esac
Q() { psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -At -c "$1"; }
fail=0
check() { if [ "$2" = "$3" ]; then echo "  ✅ $1 ($3)"; else echo "  ❌ $1: expected '$2', got '$3'"; fail=1; fi; }
# expect_fail <name> <constraint-substring> <sql>: the statement must fail and mention the constraint
expect_fail() {
  out=$(psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -At -c "$3" 2>&1 || true)
  if echo "$out" | grep -q "$2"; then echo "  ✅ $1 (rejected by $2)"; else echo "  ❌ $1: expected rejection by $2, got: $out"; fail=1; fi
}
expect_ok() {
  if psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -At -c "$2" >/dev/null 2>&1; then echo "  ✅ $1"; else echo "  ❌ $1: statement was rejected"; fail=1; fi
}

echo "1) apply every migration before $NEW (legacy schema), then the legacy fixture + instructors"
for d in prisma/migrations/*/; do
  n=$(basename "$d"); [ "$n" = "$NEW" ] && continue
  [ -f "$d/migration.sql" ] && psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -f "$d/migration.sql" >/dev/null
done
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -f scripts/fixtures/legacy-data.sql >/dev/null
# One instructor on two courses (the roster shape), one course without an instructor.
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q <<'SQL' >/dev/null
INSERT INTO instructors (id, name, credentials, rating, verified, "updatedAt") VALUES
  ('i_ada', 'Ada Teacher', ARRAY[]::text[], 5, true, now()),
  ('i_bob', 'Bob Teacher', ARRAY[]::text[], 4, true, now());
UPDATE courses SET "instructorId"='i_ada' WHERE id IN ('c_lagos_gtr','c_online_pno');
SQL
before_courses=$(Q 'select count(*) from courses'); before_enr=$(Q 'select count(*) from enrollments')
before_inst=$(Q 'select count(*) from instructors'); before_status=$(Q "select string_agg(id||':'||status, ',' order by id) from enrollments")
before_pref=$(Q "select string_agg(id||':'||coalesce(\"schedulePreference\",'-')||':'||coalesce(array_to_string(\"preferredDays\",'|'),''), ',' order by id) from enrollments")

echo "2) apply $NEW"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -f "prisma/migrations/$NEW/migration.sql" >/dev/null

echo "3) data assertions"
check "no course lost"            "$before_courses" "$(Q 'select count(*) from courses')"
check "no enrollment lost"        "$before_enr" "$(Q 'select count(*) from enrollments')"
check "no instructor lost"        "$before_inst" "$(Q 'select count(*) from instructors')"
check "enrollment statuses untouched" "$before_status" "$(Q "select string_agg(id||':'||status, ',' order by id) from enrollments")"
check "legacy schedulePreference/preferredDays untouched" "$before_pref" "$(Q "select string_agg(id||':'||coalesce(\"schedulePreference\",'-')||':'||coalesce(array_to_string(\"preferredDays\",'|'),''), ',' order by id) from enrollments")"
check "InstructorCourse backfilled from Course.instructorId" "c_lagos_gtr,c_online_pno" "$(Q "select string_agg(\"courseId\", ',' order by \"courseId\") from instructor_courses where \"instructorId\"='i_ada'")"
check "courses without an instructor produce no row" "2" "$(Q 'select count(*) from instructor_courses')"
check "Course.instructorId still set (public /tutors)" "2" "$(Q "select count(*) from courses where \"instructorId\"='i_ada'")"
check "new preference columns default empty" "0" "$(Q "select count(*) from enrollments where cardinality(\"preferredTimeBands\") <> 0 or \"preferredFromTime\" is not null or \"preferredClassesPerWeek\" is not null")"
check "btree_gist installed" "btree_gist" "$(Q "select extname from pg_extension where extname='btree_gist'")"
check "no sessions or availability yet" "0" "$(Q 'select (select count(*) from class_sessions)+(select count(*) from instructor_availability)')"

echo "4) constraint behaviour (raw SQL, the same statements an app bug could issue)"
# e_paid is student s1, e_online is student s3, e_pending is student s2.
INS() { # id enrollment student instructor start(local text, +01) mins status seq
  echo "INSERT INTO class_sessions (id,\"enrollmentId\",\"studentId\",\"instructorId\",mode,\"startsAt\",\"durationMins\",\"endsAt\",status,sequence,\"updatedAt\") VALUES ('$1','$2','$3','$4','CENTRE','$5+01',$6,('$5+01'::timestamptz + $6 * interval '1 minute'),'$7',$8,now())"
}
expect_ok   "book Ada Mon 09:00-10:00 for s1"             "$(INS a1 e_paid s1 i_ada '2026-11-09 09:00' 60 scheduled 1)"
expect_fail "same instructor overlapping (09:30) rejected" "class_sessions_instructor_no_overlap" "$(INS a2 e_online s3 i_ada '2026-11-09 09:30' 45 scheduled 1)"
expect_fail "same instructor identical slot rejected"      "class_sessions_instructor_no_overlap" "$(INS a3 e_online s3 i_ada '2026-11-09 09:00' 60 scheduled 1)"
expect_ok   "back-to-back (10:00 right after 09:00-10:00) accepted" "$(INS a4 e_online s3 i_ada '2026-11-09 10:00' 45 scheduled 1)"
expect_ok   "45-min class then a 60-min class right after accepted" "$(INS a5 e_pending s2 i_ada '2026-11-09 10:45' 60 scheduled 1)"
expect_fail "same STUDENT with another instructor at the same time rejected" "class_sessions_student_no_overlap" "$(INS b1 e_paid s1 i_bob '2026-11-09 09:30' 60 scheduled 2)"
expect_ok   "different instructor + different student same time accepted" "$(INS b2 e_pending s2 i_bob '2026-11-09 09:00' 60 scheduled 2)"
expect_fail "same enrollment slot (sequence) twice rejected" "class_sessions_slot_unique" "$(INS c1 e_paid s1 i_bob '2026-11-10 09:00' 60 scheduled 1)"
expect_ok   "a cancelled row does not block the time"     "$(INS d1 e_paid s1 i_ada '2026-11-09 09:00' 60 cancelled 3)"
expect_ok   "a rescheduled row does not block the time"   "$(INS d2 e_paid s1 i_ada '2026-11-09 09:00' 60 rescheduled 4)"
expect_ok   "a missed row does not block the TIME (but keeps its slot)" "$(INS d3 e_paid s1 i_ada '2026-11-09 09:15' 60 missed 5)"
expect_fail "a missed row still occupies its sequence slot" "class_sessions_slot_unique" "$(INS d4 e_paid s1 i_bob '2026-11-12 09:00' 60 scheduled 5)"
expect_ok   "mark Ada's 09:00 class held" "UPDATE class_sessions SET status='held' WHERE id='a1'"
expect_fail "overlap with a HELD class rejected"          "class_sessions_instructor_no_overlap" "$(INS e1 e_online s3 i_ada '2026-11-09 09:30' 45 scheduled 9)"
expect_fail "re-activating a cancelled row onto a taken slot rejected" "class_sessions_instructor_no_overlap" "UPDATE class_sessions SET status='scheduled' WHERE id='d1'"
expect_fail "endsAt that disagrees with duration rejected" "class_sessions_ends_chk" "INSERT INTO class_sessions (id,\"enrollmentId\",\"studentId\",\"instructorId\",mode,\"startsAt\",\"durationMins\",\"endsAt\",status,sequence,\"updatedAt\") VALUES ('f1','e_paid','s1','i_bob','CENTRE','2026-11-20 09:00+01',60,'2026-11-20 11:00+01','scheduled',7,now())"
expect_fail "duration other than 45/60 rejected"          "class_sessions_duration_chk" "$(INS f2 e_paid s1 i_bob '2026-11-21 09:00' 30 scheduled 8)"
expect_fail "unknown status rejected"                      "class_sessions_status_chk" "$(INS f3 e_paid s1 i_bob '2026-11-22 09:00' 60 bogus 8)"
expect_fail "student that is not the enrollment's student rejected (composite FK)" "class_sessions_enrollmentId_studentId_fkey" "$(INS f4 e_paid s2 i_bob '2026-11-23 09:00' 60 scheduled 8)"
expect_fail "instructor with sessions cannot be deleted"   "class_sessions_instructorId_fkey" "DELETE FROM instructors WHERE id='i_ada'"

echo "5) availability constraints"
LOC=$(Q "select id from locations where name='Lagos'")
AV() { echo "INSERT INTO instructor_availability (id,\"instructorId\",weekday,\"startMinute\",\"endMinute\",\"locationId\",mode,\"updatedAt\") VALUES ('$1','i_ada',$2,$3,$4,'$LOC','$5',now())"; }
expect_ok   "Mon 09:00-12:00 centre window"        "$(AV w1 1 540 720 CENTRE)"
expect_fail "overlapping window same weekday rejected" "instructor_availability_no_overlap" "$(AV w2 1 700 800 HOME)"
expect_ok   "adjacent window same weekday accepted" "$(AV w3 1 720 840 HOME)"
expect_ok   "same hours different weekday accepted" "$(AV w4 2 540 720 CENTRE)"
expect_fail "start >= end rejected"                 "instructor_availability_minutes_chk" "$(AV w5 3 600 600 CENTRE)"
expect_fail "end beyond midnight rejected"          "instructor_availability_minutes_chk" "$(AV w6 3 600 1500 CENTRE)"
expect_fail "weekday 0 / 8 rejected"                "instructor_availability_weekday_chk" "$(AV w7 8 600 700 CENTRE)"
expect_fail "unknown mode rejected"                 "instructor_availability_mode_chk" "$(AV w8 4 600 700 PHONE)"

echo "6) prisma agrees the migration history matches schema.prisma"
drift=$(npx prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --script 2>/dev/null | grep -v "^$" | grep -v "Loaded Prisma" | tr -d '\n' || true)
check "no schema drift after migration" "-- This is an empty migration." "$drift"

EPHEMERAL_PG_PORT=$PORT EPHEMERAL_PG_DIR="${TMPDIR:-/tmp}/banafix-sched-pg" scripts/dev/ephemeral-pg.sh stop
if [ "$fail" = 0 ]; then echo "ALL SCHEDULING MIGRATION ASSERTIONS PASSED"; else echo "SCHEDULING MIGRATION VERIFICATION FAILED"; exit 1; fi
