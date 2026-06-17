#!/usr/bin/env bash
# Build and (re)start one environment's stack. Usage: npm run deploy <dev|prod>
set -euo pipefail

cd "$(dirname "$0")/.."

ENV_NAME="${1:-}"
if [ -z "$ENV_NAME" ]; then
    echo "usage: npm run deploy <dev|prod>" >&2
    exit 1
fi

ENV_FILE=".env.$ENV_NAME"
if [ ! -f "$ENV_FILE" ]; then
    echo "error: $ENV_FILE not found (cp .env.deploy.example $ENV_FILE and fill it in)" >&2
    exit 1
fi

echo "▶ Deploying soupi ($ENV_NAME)…"
docker compose --env-file "$ENV_FILE" up -d --build
echo
docker compose --env-file "$ENV_FILE" ps
