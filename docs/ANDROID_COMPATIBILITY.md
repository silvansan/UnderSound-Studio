# Android Compatibility

This document protects the public link and API behavior that the Android app and QR codes depend on.

## Stable Listener Links

Primary listener URL:

```text
/listen/:eventSlug/:channelSlug
```

This is the preferred QR code and Android listener link.

Compatibility redirect:

```text
/listener/:eventSlug/:channelSlug -> /listen/:eventSlug/:channelSlug
```

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

Android-safe public endpoints:

- `GET /api/public/listen/:eventSlug/:channelSlug`
- `GET /api/events/:eventSlug/channels`

These return only public event/channel fields. They must not return:

- user records
- assignment records
- password hashes
- Payload auth data
- LiveKit API secrets
- SMTP secrets

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
undersound_{eventSlug}_{channelSlug}
```

## Change Rules

- Do not change `/listen/:eventSlug/:channelSlug`.
- Do not change the listener token endpoint contract without Android testing.
- Keep old URL redirects when adding new route shapes.
- Add migration or redirect support before removing any public route.
- Test QR scanning from Android before release.
