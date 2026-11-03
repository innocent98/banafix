#!/usr/bin/env bash
# Captures REAL request/response pairs for docs/fe-integration-guide-scheduling.md from a running app
# on a THROWAWAY database seeded with scripts/dev/seed-scheduling-demo.ts. Refuses non-local targets.
#   BASE=http://localhost:3070 DB=postgresql://postgres@127.0.0.1:5470/postgres scripts/dev/capture-scheduling.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
BASE="${BASE:-http://localhost:3070}"; DB="${DB:-postgresql://postgres@127.0.0.1:5470/postgres}"
case "$BASE$DB" in *localhost*127.0.0.1*|*127.0.0.1*127.0.0.1*) ;; *) echo "refusing: not local" >&2; exit 1;; esac
OUT=docs/captures/scheduling; mkdir -p "$OUT"; rm -f "$OUT"/*.json
Q() { psql "$DB" -At -c "$1"; }
TOKEN=$(curl -s "$BASE/api/admin/auth/login" -H 'Content-Type: application/json' -d '{"email":"admin@banafix.com","password":"admin123"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")
n=0
cap() { # name method path [body]  -> writes {request, status, response}
  n=$((n+1)); f=$(printf "%s/%02d-%s.json" "$OUT" "$n" "$1")
  body="${4:-}"
  if [ -n "$body" ]; then resp=$(curl -s -w '\n%{http_code}' -X "$2" "$BASE$3" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d "$body")
  else resp=$(curl -s -w '\n%{http_code}' -X "$2" "$BASE$3" -H "Authorization: Bearer $TOKEN"); fi
  code=$(echo "$resp" | tail -n1); json=$(echo "$resp" | sed '$d')
  python3 - "$f" "$2" "$3" "$body" "$code" "$json" <<'PY'
import sys, json
f, method, path, body, code, resp = sys.argv[1:7]
doc = {"request": {"method": method, "path": path, **({"body": json.loads(body)} if body else {})}, "status": int(code), "response": json.loads(resp)}
open(f, "w").write(json.dumps(doc, indent=2) + "\n")
PY
  echo "$f -> $code"
}
# Fixture beyond the demo seed: an offerable offering and one walk-in student with evening preferences.
GUITAR=$(Q "select id from courses where title='Guitar Foundations'")
Q "insert into course_offerings (id,\"courseId\",\"locationId\",\"deliveryModeId\",\"isActive\",\"updatedAt\") select 'off_demo', '$GUITAR', l.id, d.id, true, now() from locations l, delivery_modes d where l.name='Lagos' and d.name='On-site'" >/dev/null
Q "insert into offering_rates (id,\"offeringId\",\"durationMins\",\"pricePerClass\",\"updatedAt\") values ('r1','off_demo',60,5000,now()),('r2','off_demo',45,4000,now())" >/dev/null
LOC=$(Q "select id from locations where name='Lagos'")
curl -s -o /dev/null "$BASE/api/admin/enrollments" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d "{\"firstName\":\"Walk\",\"lastName\":\"In\",\"email\":\"walk@demo.test\",\"locationId\":\"$LOC\",\"courseId\":\"$GUITAR\",\"offeringId\":\"off_demo\",\"feePaid\":true,\"preferredDays\":[\"wed\",\"mon\"],\"preferredTimeBands\":[\"evening\"],\"preferredFromTime\":\"18:30\",\"preferredToTime\":\"20:00\",\"preferredClassesPerWeek\":2}"
ADA=$(Q "select id from instructors where name='Ada Okafor'"); TUNDE=$(Q "select id from instructors where name='Tunde Bello'")
LAGOS=$(Q "select id from locations where name='Lagos'")
E_DAYO=$(Q "select e.id from enrollments e join students s on s.id=e.\"studentId\" where s.email='dayo@demo.test'")
E_CHI=$(Q "select e.id from enrollments e join students s on s.id=e.\"studentId\" where s.email='chi@demo.test'")
E_WALK=$(Q "select e.id from enrollments e join students s on s.id=e.\"studentId\" where s.email='walk@demo.test'")

cap availability-get GET "/api/admin/instructors/$ADA/availability"
cap availability-put-overlap PUT "/api/admin/instructors/$ADA/availability" "{\"slots\":[{\"weekday\":1,\"start\":\"09:00\",\"end\":\"12:00\",\"locationId\":\"$LAGOS\",\"mode\":\"CENTRE\"},{\"weekday\":1,\"start\":\"11:00\",\"end\":\"13:00\",\"locationId\":\"$LAGOS\",\"mode\":\"HOME\"}]}"
cap availability-put-online-mismatch PUT "/api/admin/instructors/$ADA/availability" "{\"slots\":[{\"weekday\":2,\"start\":\"09:00\",\"end\":\"10:00\",\"locationId\":\"$LAGOS\",\"mode\":\"ONLINE\"}]}"
cap schedule-not-planned POST "/api/admin/enrollments/$E_WALK/schedule" "{\"instructorId\":\"$ADA\",\"startDate\":\"2026-11-09\"}"
Q "update enrollments set status='plan_agreed', \"durationMins\"=60, \"classesPerWeek\"=2, \"plannedClasses\"=4 where id='$E_WALK'" >/dev/null
cap schedule-unplaceable POST "/api/admin/enrollments/$E_WALK/schedule" "{\"instructorId\":\"$ADA\",\"startDate\":\"2026-11-09\"}"
cap schedule-dryrun-unplaceable POST "/api/admin/enrollments/$E_WALK/schedule" "{\"instructorId\":\"$ADA\",\"startDate\":\"2026-11-09\",\"dryRun\":true}"
cap schedule-override-no-reason POST "/api/admin/enrollments/$E_WALK/schedule" "{\"instructorId\":\"$ADA\",\"startDate\":\"2026-11-09\",\"overrideAvailability\":true}"
cap enrollment-schedule-get GET "/api/admin/enrollments/$E_DAYO/schedule"
cap schedule-bad-start-date POST "/api/admin/enrollments/$E_DAYO/schedule" "{\"instructorId\":\"$TUNDE\",\"startDate\":\"not-a-date\"}"
cap schedule-dryrun POST "/api/admin/enrollments/$E_DAYO/schedule" "{\"instructorId\":\"$ADA\",\"startDate\":\"2026-11-09\",\"count\":3,\"dryRun\":true}"
cap schedule-create POST "/api/admin/enrollments/$E_DAYO/schedule" "{\"instructorId\":\"$ADA\",\"startDate\":\"2026-11-09\",\"count\":3}"
S1=$(Q "select id from class_sessions where \"enrollmentId\"='$E_DAYO' and sequence=1")
CHI_S1=$(Q "select \"startsAt\" at time zone 'UTC' from class_sessions where \"enrollmentId\"='$E_CHI' and sequence=1" | sed 's/ /T/')Z
cap reschedule-instructor-busy POST "/api/admin/sessions/$S1/reschedule" "{\"startsAt\":\"$CHI_S1\"}"
cap reschedule-outside-availability POST "/api/admin/sessions/$S1/reschedule" '{"startsAt":"2026-11-10T08:00:00.000Z"}'
cap reschedule-override-no-reason POST "/api/admin/sessions/$S1/reschedule" '{"startsAt":"2026-11-10T08:00:00.000Z","overrideAvailability":true}'
cap reschedule-override-ok POST "/api/admin/sessions/$S1/reschedule" '{"startsAt":"2026-11-10T08:00:00.000Z","overrideAvailability":true,"overrideReason":"Parent request"}'
S2=$(Q "select id from class_sessions where \"enrollmentId\"='$E_DAYO' and sequence=2")
cap status-held-too-early POST "/api/admin/sessions/$S2/status" '{"status":"held"}'
cap status-rescheduled-refused POST "/api/admin/sessions/$S2/status" '{"status":"rescheduled"}'
cap status-cancel POST "/api/admin/sessions/$S2/status" '{"status":"cancelled","note":"Student travelling"}'
cap status-after-cancel POST "/api/admin/sessions/$S2/status" '{"status":"scheduled"}'
cap timetable GET "/api/admin/schedule?from=2026-11-09&to=2026-11-15&instructorId=$ADA"
cap timetable-bad-range GET "/api/admin/schedule?from=2026-11-15&to=2026-11-09"
cap instructor-delete-with-classes DELETE "/api/admin/instructors/$ADA"
echo "audit actions written:"; Q "select action, count(*) from audit_logs group by 1 order by 1"
