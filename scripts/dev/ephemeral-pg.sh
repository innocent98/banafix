#!/usr/bin/env bash
# Ephemeral local Postgres for migration/webhook verification. NEVER touches .env / production.
#   scripts/dev/ephemeral-pg.sh start   -> prints the DATABASE_URL to use
#   scripts/dev/ephemeral-pg.sh stop
#   scripts/dev/ephemeral-pg.sh reset   -> stop, wipe, start fresh
set -euo pipefail
PORT="${EPHEMERAL_PG_PORT:-5466}"
DIR="${EPHEMERAL_PG_DIR:-${TMPDIR:-/tmp}/banafix-ephemeral-pg-${PORT}}" # per-port: two sessions must never share (and wipe) one data dir
URL="postgresql://postgres@127.0.0.1:${PORT}/postgres"

start() {
  if [ ! -d "$DIR" ]; then
    initdb -D "$DIR" -U postgres --auth=trust >/dev/null
  fi
  if ! pg_ctl -D "$DIR" status >/dev/null 2>&1; then
    LC_ALL=C pg_ctl -D "$DIR" -l "$DIR/pg.log" -o "-p ${PORT} -k /tmp -c listen_addresses=127.0.0.1" -w start >/dev/null
  fi
  echo "$URL"
}
stop() { pg_ctl -D "$DIR" -m fast stop >/dev/null 2>&1 || true; }

case "${1:-}" in
  start) start ;;
  stop) stop ;;
  reset) stop; rm -rf "$DIR"; start ;;
  *) echo "usage: $0 start|stop|reset" >&2; exit 2 ;;
esac
