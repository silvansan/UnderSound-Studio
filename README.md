# UnderSound Studio

Self-hosted live translation and event audio management.

UnderSound Studio is a Payload CMS 3 + Next.js app for creating events, channels, listener links, speaker links, QR codes, and LiveKit audio rooms. It is built to deploy as one Docker Compose stack with PostgreSQL and LiveKit included.

Built with Cursor-assisted development.

## What It Does

- Create events and language/audio channels.
- Generate listener and speaker links with QR codes.
- Let speakers publish microphone audio through LiveKit.
- Let listeners connect from browser or mobile app.
- Manage users with `super_admin`, `admin`, and `moderator` roles.
- Keep Payload admin available for super-admin back-office work.
- Run locally, on LAN, or in cloud from the same Compose stack.

## Stack

- Next.js 15
- Payload CMS 3
- TypeScript
- PostgreSQL
- LiveKit
- Docker Compose
- Tailwind CSS

## Quick Start

```bash
cp .env.example .env
docker compose up -d --build
```

Open:

```text
http://localhost:3000
```

For LAN phone testing, open the app from your computer's LAN address instead:

```text
http://192.168.x.x:3000
```

QR codes use the host you opened the app with, so LAN URLs work on phones and cloud URLs work in production.

## Included Services

- `app`: Next.js + Payload
- `db`: PostgreSQL
- `livekit`: self-hosted LiveKit WebRTC server
- `maildev`: optional local email catcher

Persistent volumes:

- `undersound_db`
- `undersound_uploads`

Do not delete these volumes during redeploys unless you intend to wipe data.

## Important Docs

- `docs/ARCHITECTURE.md`
- `docs/API.md`
- `docs/ROUTES.md`
- `docs/LIVEKIT.md`
- `docs/DEPLOYMENT.md`
- `docs/PORTAINER.md`
- `docs/SECURITY.md`
- `docs/MIGRATION.md`
- `docs/ANDROID_COMPATIBILITY.md`
- `docs/MOBILE_LINK_PARSER_UPDATE.md`
- `docs/TESTING.md`

## Mobile Compatibility

Stable listener links:

```text
/listen/:eventSlug/:channelSlug
```

The Android/Flutter app should parse these links and load:

```text
GET /api/public/listen/:eventSlug/:channelSlug
POST /api/livekit/listener-token
```

See `docs/MOBILE_LINK_PARSER_UPDATE.md`.

## Production Notes

- Change every secret in `.env`.
- Use HTTPS in production.
- Point `PUBLIC_BASE_URL` and `NEXT_PUBLIC_APP_URL` to the public app URL.
- Point `LIVEKIT_URL` to the browser-reachable LiveKit WebSocket URL.
- Back up `undersound_db` and `undersound_uploads`.

## License

MIT
