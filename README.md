<p align=center><img width="250" height="250" alt="ablaut logo" src="./public/ablaut-icon.png" /></p>

  
  
  # ablaut

Self-hosted live translation and event audio management. 

[ablaut-App](https://github.com/silvansan/ablaut-App) as a receiver on Android phones.

iOS app to be released soon.

## ablaut `[ˈap.laʊt]` uses the `[aʊ]` mark for the logo - in linguistics, ablaut is a systematic variation of vowels within the same root or affix to indicate changes in grammatical function or meaning, particularly in Indo-European languages.

This project's goal to provide sub-second live translation or an assisted-listening solution for events, HOW, on-campus or out-of-campus non-profit organizations. The "ablaut" is connected in meaning to the core of the project on the linguistic side of things, as this project sprung from a need to cover the misunderstanding based of the variations in the Indo-European languages, but, of course, not only of the vowels. 

The back-end and the front-end: a [Payload CMS 3](https://github.com/payloadcms/payload) + Next.js app that creates events, channels, listener links, speaker links, QR codes. All this on top of [LiveKit](https://github.com/livekit/livekit) audio rooms. It is built to deploy as one Docker Compose stack with PostgreSQL and LiveKit included.


Built with Cursor-assisted development.

## Purpose

ablaut is intended to provide accessible live translation and event-audio tools for charity organizations, churches, community groups, and low-income associations.


The project is not intended to be commercially exploited in ways that take advantage of those communities. Commercial use is discouraged unless it directly supports this mission, contributes improvements back, or is arranged with the project maintainer.

## What It Does

- Create organisations, events and language/audio channels.
- Generate listener and speaker links with QR codes.
- Let speakers publish microphone audio through LiveKit.
- Let listeners connect from browser or mobile app.
- Manage users with `super_admin`, `admin`, and `moderator` roles.
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

### Easy Portainer Deployment

Start here for a server install:

```text
PORTAINER_EASY_STACK_DEPLOYMENT.md
```

It includes the copy-paste stack flow, environment variables, proxy setup, and required ports. For the shortest path, paste `PORTAINER_STACK_COPY_PASTE.yml` into a Portainer stack and replace the `CHANGE_ME` values.

### Local Docker

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

## Mobile App

Android APK downloads are published through the ablaut-App GitHub Releases page:

[CHECK THE LATEST RELEASE](https://github.com/silvansan/ablaut-App/releases)

## Included Services

- `app`: Next.js + Payload
- `db`: PostgreSQL
- `livekit`: self-hosted LiveKit WebRTC server
- `maildev`: optional local email catcher

Persistent volumes:

- `ablaut_db`
- `ablaut_uploads`

Do not delete these volumes during redeploys unless you intend to wipe data.

## Important Docs

- `docs/ARCHITECTURE.md`
- `docs/API.md`
- `docs/ROUTES.md`
- `docs/LIVEKIT.md`
- `docs/DEPLOYMENT.md`
- `docs/PORTAINER.md`
- `PORTAINER_EASY_STACK_DEPLOYMENT.md`
- `PORTAINER_STACK_COPY_PASTE.yml`
- `PORTAINER_STACK_PINNED.yml`
- `docs/SECURITY.md`
- `docs/MIGRATION.md`
- `docs/ANDROID_COMPATIBILITY.md`
- `docs/TESTING.md`

## Production Notes

- Change every secret in `.env`.
- Use HTTPS in production.
- Point `PUBLIC_BASE_URL` and `NEXT_PUBLIC_APP_URL` to the public app URL.
- Point `LIVEKIT_URL` to the browser-reachable LiveKit WebSocket URL.
- Proxy `ablaut.example.com` to app port `3000`.
- Proxy `livekit.example.com` to LiveKit port `7880` with WebSocket support.
- Forward LiveKit RTC ports `7881/tcp` and `50000-50100/udp`.
- Back up `ablaut_db` and `ablaut_uploads`.

## License

GNU Affero General Public License v3.0 or later (`AGPL-3.0-or-later`).

See `LICENSE`.



# Screenshots

<img width="100%" alt="image" src="https://github.com/user-attachments/assets/424cb155-8e35-42d9-92f8-a8f575b36dc4" />
<img width="100%" alt="image" src="https://github.com/user-attachments/assets/802f2f89-ddc5-41b6-9e25-bfb9180d6637" />
<img width="100%" alt="image" src="https://github.com/user-attachments/assets/c9375823-8236-472d-a89f-aaffdfd215fb" />
<img width="100%" alt="image" src="https://github.com/user-attachments/assets/f9ab56eb-b6f1-4321-b759-3770a058dc22" />
<img width="100%" alt="image" src="https://github.com/user-attachments/assets/e95a5163-ef94-4b35-bdd3-85e0a25c92af" />


