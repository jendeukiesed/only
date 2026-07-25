#!/bin/sh
set -e

# Applies any pending migrations before the server starts accepting traffic.
# Uses `migrate deploy` (not `migrate dev`) — the production-safe command
# that only applies already-generated migration files and never tries to
# create new ones or prompt interactively.
echo "[entrypoint] Running database migrations..."
node_modules/.bin/prisma migrate deploy --schema=db/prisma/schema.prisma

echo "[entrypoint] Starting server..."
exec "$@"
