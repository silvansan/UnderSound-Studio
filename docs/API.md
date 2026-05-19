# ablaut API Contract

This document is the compatibility contract for public listener/speaker links, QR codes, and Android app integration.

Do not change these routes without also updating Android compatibility handling and redirects.

## Public Pages

### Listener page

`GET /listen/:eventSlug/:channelSlug`

Browser-facing mobile listener page.

- Public route.
- Does not require Payload login.
- Shows listener connection UI when the event is active, public listener pages are enabled, and the channel is enabled.
- Uses WebRTC first when configured.
- Shows fallback stream link when `icecastFallbackUrl` is configured.

### Speaker page

`GET /speak/:eventSlug/:channelSlug`

Browser-facing speaker/transmitter page.

- Public route.
- Does not require Payload login.
- May require event-level or channel-level speaker password.
- Speaker password only unlocks speaker publishing for that page; it is not a user login.
- Publishes audio with browser echo cancellation, noise suppression, and auto gain control disabled by default.

## Public Metadata Endpoints

### Listener metadata

`GET /api/public/listen/:eventSlug/:channelSlug`

Returns `404` unless the listener page is publicly available.

Response:

```json
{
  "access": {
    "listenerTokenMode": "public",
    "listenerPasswordRequired": false,
    "listenerPasswordConfigured": true,
    "listenerPasswordMissing": false,
    "listenerUnavailable": false,
    "verifyPasswordEndpoint": "/api/listener/verify-password"
  },
  "event": {
    "title": "Event title",
    "slug": "event-slug",
    "status": "active",
    "defaultLanguage": "en",
    "publicListenerEnabled": true,
    "listenerPasswordEnabled": false,
    "speakerPasswordEnabled": false
  },
  "channel": {
    "name": "English",
    "slug": "en",
    "description": "Optional description",
    "languageCode": "en",
    "languageLabel": "English",
    "enabled": true,
    "listenerPageEnabled": true,
    "speakerPageEnabled": true,
    "listenerTokenMode": "public",
    "speakerPasswordEnabled": false,
    "webrtcEnabled": true,
    "hlsEnabled": false,
    "icecastFallbackUrl": null
  },
  "livekit": {
    "roomName": "ablaut_event-slug_en",
    "tokenEndpoint": "/api/livekit/listener-token",
    "url": "wss://livekit.example.com"
  }
}
```

### Speaker metadata

`GET /api/public/speak/:eventSlug/:channelSlug`

Returns `404` unless the speaker page is publicly available.

Response shape is the same as listener metadata, with:

```json
{
  "livekit": {
    "tokenEndpoint": "/api/livekit/speaker-token"
  }
}
```

### Public event channels

`GET /api/events/:eventSlug/channels`

Returns public channel listing for active events only.

Response:

```json
{
  "event": {
    "title": "Event title",
    "slug": "event-slug",
    "defaultLanguage": "en",
    "publicListenerEnabled": true
  },
  "channels": [
    {
      "name": "English",
      "slug": "en",
      "description": "Optional description",
      "languageCode": "en",
      "languageLabel": "English",
      "listenerPageEnabled": true,
      "speakerPageEnabled": true,
      "listenerTokenMode": "public",
      "webrtcEnabled": true,
      "hlsEnabled": false,
      "icecastFallbackUrl": null
    }
  ]
}
```

## LiveKit Token Endpoints

LiveKit API secrets are never exposed to the browser. Tokens are generated server-side only.

### Listener token

`POST /api/livekit/listener-token`

Body:

```json
{
  "eventSlug": "event-slug",
  "channelSlug": "en",
  "identity": "optional-client-identity",
  "listenerSessionToken": "optional-after-verify"
}
```

Header alternative for native apps:

```http
X-Ablaut-Listener-Session: <token-from-verify-password>
```

Rules:

- Event must be active.
- Public listener pages must be enabled.
- Channel must be enabled.
- Channel listener page must be enabled.
- **Public** channels: no session required.
- **Password** channels: valid `listenerSessionToken` (from `POST /api/listener/verify-password`) or matching session cookie.
- **Private** channels: token denied until a future release.
- Token can subscribe only.
- Token cannot publish.

Success response:

```json
{
  "token": "jwt",
  "url": "wss://livekit.example.com",
  "roomName": "ablaut_event-slug_en",
  "expiresIn": 3600
}
```

Errors:

- `400` when `eventSlug` or `channelSlug` is missing.
- `403` when listener token is not available.
- `404` when channel is not found.
- `503` when LiveKit is not configured.

### Speaker token

`POST /api/livekit/speaker-token`

Body:

```json
{
  "eventSlug": "event-slug",
  "channelSlug": "en",
  "identity": "optional-client-identity",
  "canSubscribe": true
}
```

Rules:

- Event must be active.
- Channel must be enabled.
- Speaker page must be enabled.
- If event/channel speaker password is enabled, the speaker session cookie must already be set by password verification.
- Token can publish audio.
- Token can subscribe when `canSubscribe` is true.

Success response:

```json
{
  "token": "jwt",
  "url": "wss://livekit.example.com",
  "roomName": "ablaut_event-slug_en",
  "expiresIn": 3600
}
```

Errors:

- `400` when `eventSlug` or `channelSlug` is missing.
- `403` when speaker token is not available.
- `404` when channel is not found.
- `503` when LiveKit is not configured.

## Listener Password Endpoint

`POST /api/listener/verify-password`

Body:

```json
{
  "eventSlug": "event-slug",
  "channelSlug": "en",
  "password": "listener-password"
}
```

Success:

```json
{
  "ok": true,
  "required": true,
  "listenerSessionToken": "signed-session-token",
  "expiresIn": 43200
}
```

- Password is stored at **event** level (shared by all password-mode channels on that event).
- Web clients also receive an HTTP-only cookie.
- Mobile clients must store `listenerSessionToken` and send it to `POST /api/livekit/listener-token`.
- `expiresIn` is seconds until the session should be refreshed.

Errors:

- `400` when password is required but missing.
- `401` when password is wrong.
- `404` when listener channel is not available.

## Speaker Password Endpoint

`POST /api/speaker/verify-password`

Body:

```json
{
  "eventSlug": "event-slug",
  "channelSlug": "en",
  "password": "speaker-password"
}
```

Success:

```json
{
  "ok": true
}
```

On success, the server sets an HTTP-only speaker session cookie scoped to the app.

Errors:

- `400` when required fields are missing.
- `401` when the password is invalid.
- `404` when the speaker channel is not available.

## QR Link Format

Current QR codes should use normal HTTPS URLs:

- Listener QR: `/listen/:eventSlug/:channelSlug`
- Speaker QR: `/speak/:eventSlug/:channelSlug`

Use absolute URLs based on `PUBLIC_BASE_URL` / `NEXT_PUBLIC_APP_URL` when generating QR images.

Android compatibility rule:

- Existing Android listener QR links must continue to open listener pages.
- If legacy QR formats are discovered later, add redirects instead of changing these stable routes.

## Room Naming

Default generated room name:

```text
ablaut_{eventSlug}_{channelSlug}
```

If an imported channel has `roomName` or `livekitRoomName`, preserve it to avoid breaking existing clients.

## Authentication Boundary

Public without Payload login:

- `GET /listen/:eventSlug/:channelSlug`
- `GET /speak/:eventSlug/:channelSlug`
- `GET /api/public/listen/:eventSlug/:channelSlug`
- `GET /api/public/speak/:eventSlug/:channelSlug`
- `GET /api/events/:eventSlug/channels`
- LiveKit token endpoints when public/password rules allow them

Requires Payload login:

- `/dashboard`
- `/events`
- `/events/:eventSlug`
- `/events/:eventSlug/settings`
- `/events/:eventSlug/channels`
- `/events/:eventSlug/channels/:channelSlug`
- `/channels`
- `/users`
- `/settings`

Super-admin only:

- `/admin`
- `/admin/*`
- full config import/export

## Config Import / Export

`GET /api/config/export?scope=events|channels|full`

- Requires Payload login.
- `events` and `channels` scopes require admin or super-admin.
- `full` scope requires super-admin.
- User password hashes, LiveKit secrets, API secrets, and SMTP secrets are never exported.
- Listener/speaker password values are exported only as stored hashes.
