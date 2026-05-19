# Local Docker build and test

Use this before Portainer or production deployment.

## Prerequisites

- Docker Desktop (or Docker Engine + Compose v2)
- Copy `.env.example` → `.env` and set at minimum:
  - `PAYLOAD_SECRET` (32+ random characters)
  - `POSTGRES_PASSWORD`
  - `LIVEKIT_API_SECRET`
  - `INITIAL_SUPER_ADMIN_EMAIL` / `INITIAL_SUPER_ADMIN_PASSWORD` (first boot only)

Optional local email testing:

```bash
docker compose --profile mail up -d
```

Maildev UI: http://localhost:1080 (SMTP on port 1025).

## Build and start

From the project root (this repository folder):

```bash
cp .env.example .env
# Edit .env — set PAYLOAD_SECRET, POSTGRES_PASSWORD, and admin bootstrap credentials
docker compose build
docker compose up -d
```

Ensure `.env` uses `POSTGRES_USER=ablaut`, `POSTGRES_DB=ablaut`, and  
`DATABASE_URI=postgres://ablaut:<password>@db:5432/ablaut` when the app runs inside Compose  
(`localhost` in `DATABASE_URI` is only for `npm run dev` on the host talking to a published `5432` port).

Rebuild after code changes:

```bash
docker compose up -d --build
```

## Smoke test

| Check | URL / command |
|-------|----------------|
| Health | http://localhost:3000/api/health → `{"ok":true,"service":"ablaut",...}` |
| Login | http://localhost:3000 |
| LiveKit | Port `7880` open; `LIVEKIT_URL=ws://localhost:7880` in `.env` |
| Maildev (optional) | http://localhost:1080 |

```bash
docker compose ps
docker compose logs app --tail 50
```

## Volumes (do not delete on redeploy)

- `ablaut_db` — PostgreSQL
- `ablaut_uploads` — media uploads

## Stop

```bash
docker compose down
```

Data persists in named volumes `ablaut_db` and `ablaut_uploads`.

Use `docker compose down -v` only if you intend to wipe local data (safe when you have no deployment to preserve).

## Next: deployment

- General ops: [DEPLOYMENT.md](./DEPLOYMENT.md)
- Portainer: [PORTAINER.md](./PORTAINER.md) and `PORTAINER_EASY_STACK_DEPLOYMENT.md` in the repo root
