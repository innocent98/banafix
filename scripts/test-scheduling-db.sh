#!/usr/bin/env bash
# Real-database scheduling tests on a THROWAWAY Postgres (default port 5470). Never touches .env/production.
#   scripts/test-scheduling-db.sh
set -euo pipefail
cd "$(dirname "$0")/.."
PORT="${EPHEMERAL_PG_PORT:-5470}"
export EPHEMERAL_PG_PORT="$PORT" EPHEMERAL_PG_DIR="${EPHEMERAL_PG_DIR:-${TMPDIR:-/tmp}/banafix-sched-test-pg}"
URL="$(scripts/dev/ephemeral-pg.sh reset)"
case "$URL" in *127.0.0.1*) ;; *) echo "refusing: not a local database" >&2; exit 1;; esac
trap 'scripts/dev/ephemeral-pg.sh stop' EXIT
DATABASE_URL="$URL" npx prisma migrate deploy >/dev/null
SCHEDULING_DB_URL="$URL" npx vitest run lib/scheduling/service.db.test.ts "$@"
