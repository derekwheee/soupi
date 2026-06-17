#!/bin/sh
# Apply pending Prisma migrations (unless disabled), then run the given command.
set -e

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
    echo "[entrypoint] prisma migrate deploy…"
    npx prisma migrate deploy
fi

exec "$@"
