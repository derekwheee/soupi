# Deploying soupi (self-hosted)

soupi runs as a Docker Compose stack — **PostgreSQL + API + Cloudflare Tunnel** —
with one isolated stack per environment (`dev`, `prod`) on the same Debian host.
Container/volume/network names are suffixed with `${ENV}`, so the two never
collide. The public path is the Cloudflare Tunnel; the API's host port is bound to
`127.0.0.1` for on-server smoke tests only.

## Prerequisites

- Debian host with Docker Engine + the Compose plugin.
- A Cloudflare Tunnel per environment (Zero Trust → Networks → Tunnels). Each
  tunnel's public hostname ingress points at `http://soupi_<env>_api:8080`.
- Network access to the current Prisma Postgres (for the one-time data migration).

## 1. Configure an environment

```bash
cp .env.deploy.example .env.dev      # then fill in (and likewise .env.prod)
```

Set per environment: `ENV`, the `POSTGRES_*` credentials, a matching
`DATABASE_URL=postgresql://<user>:<pass>@db:5432/<db>`, Clerk keys (test for dev /
live for prod), `OPENAI_API_KEY`, `CORS_ORIGINS` (the sous-web origin), a distinct
`API_PORT` per env (e.g. dev 8080, prod 8081), and the `TUNNEL_TOKEN`.
These files are gitignored — keep them on the server only.

## 2. One-time data migration (Prisma Postgres → self-hosted)

Start just the database, then dump from the current Prisma Postgres (use the
**direct** `…_POSTGRES_URL`, not the Accelerate URL) and load it in. Do this with
the API **not yet running** so schema + data + Prisma migration history all come
from the dump.

Pass `--env-file .env.<env>` on **every** `docker compose` command (otherwise
`POSTGRES_*` are blank and the DB initializes with wrong creds). Use a `pg_dump`
image whose major version **matches the source server** (Prisma Postgres is
currently PG17, so the `db` service and the dump both use `postgres:17`).

```bash
# Bring up only Postgres
docker compose --env-file .env.dev up -d db

# Dump the source DB. `-e SRC` forwards the URL into the container (keeps it out
# of the process list); the prefixed assignment alone wouldn't expand in `$SRC`.
# Use the exact direct DEV_POSTGRES_URL / PROD_POSTGRES_URL (not the Accelerate URL).
SRC='postgres://USER:PASSWORD@db.prisma.io:5432/DBNAME?sslmode=require' \
  docker run --rm -e SRC postgres:17-alpine \
  sh -c 'pg_dump "$SRC" --no-owner --no-privileges' > soupi_dev.sql

# Load it into the self-hosted db (creates schema, data, and _prisma_migrations)
docker exec -i soupi_dev_db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < soupi_dev.sql
```

Then bring up the full stack — `prisma migrate deploy` runs on start
(`RUN_MIGRATIONS=true`) and is a no-op once the dump's migration history is in place.

## 3. Deploy

```bash
npm run deploy dev        # = docker compose --env-file .env.dev up -d --build
npm run deploy prod
```

Verify, then set the tunnel ingress to `http://soupi_<env>_api:8080`:

```bash
curl http://127.0.0.1:8080/health     # {"db":"ok","status":"ok"}  (use API_PORT)
docker compose --env-file .env.dev logs -f api
```

## Operations

```bash
# Logs / status / stop (per environment)
docker compose --env-file .env.dev logs -f
docker compose --env-file .env.dev ps
docker compose --env-file .env.dev down            # add -v to also drop the DB volume

# Update to latest code
git pull && npm run deploy dev

# Back up a self-hosted DB
docker exec soupi_dev_db pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" > backup-$(date +%F).sql
```

## Notes

- **Migrations** run on container start; set `RUN_MIGRATIONS=false` to manage them
  out of band.
- **Secrets** live only in `.env.dev` / `.env.prod` on the host (gitignored).
  `DATABASE_URL` must stay in sync with the `POSTGRES_*` values.
- **CORS** is locked to `CORS_ORIGINS`; set it to the deployed sous-web origin(s).
- Single instance per env — the in-memory rate limiter and SSE broadcaster are
  fine. If you ever scale horizontally, move both to Redis.
