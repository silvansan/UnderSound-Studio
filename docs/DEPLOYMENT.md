# Deployment

For a local Docker build and smoke test before production, see [LOCAL_DOCKER.md](./LOCAL_DOCKER.md).

ablaut is designed to run as a simple Docker Compose stack:

- `app`: Next.js + Payload CMS
- `db`: PostgreSQL
- `livekit`: self-hosted LiveKit WebRTC server
- `maildev`: optional local email catcher

## First Install

1. Copy `.env.example` to `.env`.
2. Set strong production values:
   - `PAYLOAD_SECRET`
   - `POSTGRES_PASSWORD`
   - `LIVEKIT_API_SECRET`
   - `DATABASE_URI`
   - `NEXT_PUBLIC_APP_URL`
   - `PUBLIC_BASE_URL`
   - `INITIAL_SUPER_ADMIN_EMAIL`
   - `INITIAL_SUPER_ADMIN_PASSWORD`
3. Configure SMTP values if available.
4. Start the stack:

```bash
docker compose up -d --build
```

The initial super admin is created only when no users exist.

## Persistent Data

These named volumes must not be deleted during updates:

- `ablaut_db`: PostgreSQL data
- `ablaut_uploads`: Payload media uploads

Redeploying the stack should not reset users, passwords, events, channels, assignments, uploaded logos, or settings.

## Database Schema

Until formal migrations are added, the stack uses:

```env
PAYLOAD_DB_PUSH=true
```

This lets Payload/Drizzle keep the database schema in sync during early deployments. After migration files are introduced, set `PAYLOAD_DB_PUSH=false` and deploy with migrations instead.

## Update Existing Deployment

1. Back up the database first.
2. Pull or upload the new app version.
3. Keep the existing `.env` and named volumes.
4. Rebuild and restart:

```bash
docker compose up -d --build
```

## Database Backup

```bash
docker compose exec db pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > ablaut-backup.sql
```

If your shell does not expand env vars, use the actual values from `.env`.

## Database Restore

Stop the app, keep the database running, then restore:

```bash
docker compose stop app
docker compose exec -T db psql -U "$POSTGRES_USER" "$POSTGRES_DB" < ablaut-backup.sql
docker compose up -d app
```

Restore into a clean database unless you intentionally know how to merge data.

## Uploads Backup

Back up the `ablaut_uploads` Docker volume from the Docker host. One portable option:

```bash
docker run --rm -v ablaut_uploads:/data -v "$PWD":/backup alpine tar czf /backup/ablaut_uploads.tgz -C /data .
```

Restore:

```bash
docker run --rm -v ablaut_uploads:/data -v "$PWD":/backup alpine sh -c "cd /data && tar xzf /backup/ablaut_uploads.tgz"
```

## SMTP

See `docs/SMTP_SETUP.md`.

For local Maildev:

```env
SMTP_HOST=maildev
SMTP_PORT=1025
SMTP_FROM=noreply@ablaut.local
```

For production, use a real SMTP provider and a verified sending domain.

## LiveKit

LiveKit is included in `docker-compose.yml` and starts with the stack.

Local defaults:

```env
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=change-me-livekit-secret
LIVEKIT_URL=ws://localhost:7880
```

Production recommendations:

- set a long random `LIVEKIT_API_SECRET`
- expose LiveKit through your reverse proxy or firewall
- set `LIVEKIT_URL` to the browser-reachable WebSocket origin, for example `wss://livekit.example.com`
- keep `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET` identical between the app and LiveKit container

The Compose stack exposes:

- `7880/tcp`: LiveKit HTTP/WebSocket API
- `7881/tcp`: RTC over TCP
- `50000-50100/udp`: RTC UDP media range

Never expose `LIVEKIT_API_SECRET` to browser code. Listener and speaker tokens are generated only by server API routes.

## Reverse Proxy and HTTPS

Put a reverse proxy in front of `app:3000`, for example Caddy, Traefik, Nginx Proxy Manager, or Cloudflare Tunnel.

Production recommendations:

- serve the app over HTTPS
- set `NEXT_PUBLIC_APP_URL` and `PUBLIC_BASE_URL` to the public HTTPS URL
- keep `PAYLOAD_SECRET` long and private
- do not expose PostgreSQL publicly
- add reverse-proxy rate limits for Payload auth routes:
  - `POST /api/users/login`: 5 requests per minute per IP, burst 10
  - `POST /api/users/forgot-password`: 3 requests per 10 minutes per IP, burst 5
  - `POST /api/users/reset-password`: 5 requests per 10 minutes per IP, burst 5

The app sets baseline security headers in middleware, but the reverse proxy should also enforce HTTPS and can add its own rate limits/security headers.

## LAN And Cloud QR Links

QR codes and quick links prefer the current browser request host.

- Docker Desktop / local LAN: open the app from the LAN address, for example `http://192.168.1.50:3000`. QR codes will use that LAN URL so phones on the same network can open them.
- Local-only testing: opening `http://localhost:3000` creates `localhost` links, which only work on the same computer.
- Cloud deployment: opening the app through `https://ablaut.example.com` creates QR links with that public domain.

If a reverse proxy is used, make sure it forwards `Host` and `X-Forwarded-Proto` correctly.
