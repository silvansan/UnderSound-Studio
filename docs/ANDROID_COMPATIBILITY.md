# Android Compatibility

This document protects the public link and API behavior that the ablaut-App/legacy Android app and QR codes depend on.

## Stable Listener Links

Primary listener URL:

```text
/listen/:eventSlug/:channelSlug
```

This is the preferred QR code and mobile listener link.

Compatibility redirect:

```text
/listener/:eventSlug/:channelSlug -> /listen/:eventSlug/:channelSlug
```

Event listener directory (one QR for all channels):

```text
/listen/:eventSlug
```

Enable on the event with **Allow one listener QR for the whole event (channel picker)** (`unifiedListenerQrEnabled`). Requires event status **active**, public listener pages enabled, and at least one non-private listener channel.

Public API:

```text
GET /api/public/listen/:eventSlug
```

Event-wide listener password (optional): `POST /api/listener/verify-password` with `{ "directory": true, "eventSlug", "password" }`. Pass returned `listenerSessionToken` as `eventListenerSessionToken` when requesting channel tokens.

## Stable Speaker Links

Primary speaker URL:

```text
/speak/:eventSlug/:channelSlug
```

Compatibility redirect:

```text
/speaker/:eventSlug/:channelSlug -> /speak/:eventSlug/:channelSlug
```

## Public Metadata

Mobile-safe public endpoints:

- `GET /api/public/listen/:eventSlug/:channelSlug`
- `GET /api/public/listen/:eventSlug` (event directory when `unifiedListenerQrEnabled` is on)
- `GET /api/events/:eventSlug/channels`

These return only public event/channel fields. They must not return:

- user records
- assignment records
- password hashes
- Payload auth data
- LiveKit API secrets
- SMTP secrets

## Listener Passwords (mobile)

After fetching public listener metadata, read the `access` object:

- `listenerPasswordRequired` — show password UI before connecting.
- `listenerPasswordMissing` — event misconfigured; show error (password mode but no event password).
- `listenerUnavailable` — `private` mode; not supported on mobile yet.

Flow:

1. `POST /api/listener/verify-password` with `eventSlug`, `channelSlug`, `password`.
2. Store returned `listenerSessionToken` in app favorites (encrypted).
3. `POST /api/livekit/listener-token` with `listenerSessionToken` in body or `X-Ablaut-Listener-Session` header.

## LiveKit Tokens

Listener token endpoint:

```text
POST /api/livekit/listener-token
```

Body:

```json
{
  "eventSlug": "event-slug",
  "channelSlug": "channel-slug"
}
```

The returned token can subscribe only. It cannot publish audio.

## Room Name Compatibility

If old Android clients depend on existing LiveKit room names, keep those values in `channel.roomName` or `channel.livekitRoomName`.

New fallback room names use:

```text
ablaut_{eventSlug}_{channelSlug}
```

## Change Rules

- Do not change `/listen/:eventSlug/:channelSlug`.
- Do not change the listener token endpoint contract without Android testing.
- Keep old URL redirects when adding new route shapes.
- Add migration or redirect support before removing any public route.
- Test QR scanning from Android before release.
