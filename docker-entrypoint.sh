#!/bin/sh
set -eu

if [ "${PAYLOAD_WAIT_FOR_DB:-true}" = "true" ] && [ -n "${DATABASE_URI:-}" ]; then
  echo "Waiting for PostgreSQL before starting ablaut..."
  node /app/scripts/wait-for-postgres.mjs
fi

exec node server.js
