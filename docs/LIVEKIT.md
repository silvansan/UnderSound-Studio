# LiveKit

UnderSound uses LiveKit for low-latency WebRTC listener and speaker audio.

LiveKit is included in the Docker Compose stack. A separate external LiveKit server is not required.

## Environment

Required variables:

```env
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
LIVEKIT_URL=
```

Optional public display URL:

```env
LIVEKIT_PUBLIC_URL=
```

`LIVEKIT_API_SECRET` must never be exposed to browser code.

## Docker Service

`docker-compose.yml` includes:

- `livekit/livekit-server`
- `7880/tcp` for LiveKit HTTP/WebSocket API
- `7881/tcp` for RTC over TCP
- `50000-50100/udp` for RTC media

Local default:

```env
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=change-me-livekit-secret
LIVEKIT_URL=ws://localhost:7880
```

For production, put LiveKit behind HTTPS/WSS or expose it directly with the required TCP/UDP ports, then set `LIVEKIT_URL` to the browser-reachable `wss://...` origin.

## Room Names

Channel token generation uses:

1. `channel.livekitRoomName`
2. `channel.roomName`
3. deterministic fallback: `undersound_{eventSlug}_{channelSlug}`

Preserve stored room names when importing old UnderSound data.

## Token Endpoints

Listener tokens:

- `POST /api/livekit/listener-token`
- server-only token creation
- grants `roomJoin: true`
- grants `canSubscribe: true`
- grants `canPublish: false`

Speaker tokens:

- `POST /api/livekit/speaker-token`
- server-only token creation
- grants `roomJoin: true`
- grants `canPublish: true`
- grants `canPublishData: true`
- grants `canSubscribe` when requested

## Speaker Audio Defaults

The browser speaker page publishes microphone audio with these defaults off:

- echo cancellation
- noise suppression
- auto gain control

This keeps music and interpreted audio from being distorted by browser voice-processing effects.

## Access Rules

Listener tokens are available only when:

- event status is `active`
- public listener pages are enabled
- channel is enabled
- channel listener page is enabled
- listener password/private mode is not active

Speaker tokens are available only when:

- event status is `active`
- channel is enabled
- speaker page is enabled
- speaker password is not required, or a valid speaker session cookie exists
