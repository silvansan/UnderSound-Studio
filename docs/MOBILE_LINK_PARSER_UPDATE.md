# Mobile Link Parser Update

This note is for updating [UnderSound-Mobile](https://github.com/silvansan/UnderSound-Mobile) to work with UnderSound Studio v2.

## Current Mobile Behavior

The mobile app currently parses old listener links in `app/lib/services/listener_link_parser.dart`.

Expected old link shape:

```text
https://server/e/:eventSlug/:channelName/listen?token=:token
```

It then calls old API shapes:

```text
GET /api/public/channel?event=:eventSlug&channel=:channelName&role=listener&token=:token
GET /api/livekit/token?channelId=:channelId&role=listener&token=:token
GET /api/channels/:channelId/hls?token=:token
```

That is no longer compatible with UnderSound Studio v2.

## New Studio v2 Link Shape

Listener QR codes and public links now use:

```text
https://server/listen/:eventSlug/:channelSlug
```

Compatibility redirects may also exist for:

```text
https://server/listener/:eventSlug/:channelSlug
```

There is no listener token in the QR URL. Listener LiveKit tokens are generated server-side on demand.

## New Public Metadata Endpoint

After parsing a listener link, the mobile app should call:

```text
GET /api/public/listen/:eventSlug/:channelSlug
```

Expected response:

```json
{
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
    "roomName": "undersound_event-slug_en",
    "tokenEndpoint": "/api/livekit/listener-token",
    "url": "ws://192.168.1.100:7880"
  }
}
```

Only public fields are returned. No Payload auth, password hashes, assignments, or secrets are exposed.

## New Listener Token Endpoint

For WebRTC playback, call:

```text
POST /api/livekit/listener-token
Content-Type: application/json
```

Body:

```json
{
  "eventSlug": "event-slug",
  "channelSlug": "en",
  "identity": "optional-mobile-listener-id"
}
```

Success response:

```json
{
  "token": "jwt",
  "url": "ws://192.168.1.100:7880",
  "roomName": "undersound_event-slug_en",
  "expiresIn": 3600
}
```

The returned token is subscribe-only. It cannot publish audio.

## Suggested Mobile Model Changes

Update `ListenerLink` from token-based old fields to slug-based fields:

```dart
class ListenerLink {
  const ListenerLink({
    required this.serverUrl,
    required this.eventSlug,
    required this.channelSlug,
    required this.originalUrl,
  });

  final Uri serverUrl;
  final String eventSlug;
  final String channelSlug;
  final Uri originalUrl;
}
```

Keep the old parser as a fallback if you still need old QR support.

## Suggested Parser Logic

Support these shapes:

```text
/listen/:eventSlug/:channelSlug
/listener/:eventSlug/:channelSlug
/e/:eventSlug/:channelSlug/listen?token=:token   legacy fallback only
undersound://listen?server=...&event=...&channel=...
```

Pseudo-Dart:

```dart
static ListenerLink parse(String input) {
  final uri = Uri.parse(input.trim());

  if (uri.scheme == 'undersound') {
    return _parseCustomScheme(uri);
  }

  if (uri.scheme != 'http' && uri.scheme != 'https') {
    throw const FormatException('Unsupported link type.');
  }

  final segments = uri.pathSegments;

  if (segments.length >= 3 &&
      (segments[0] == 'listen' || segments[0] == 'listener')) {
    return ListenerLink(
      serverUrl: _origin(uri),
      eventSlug: segments[1],
      channelSlug: segments[2],
      originalUrl: uri,
    );
  }

  final eventIndex = segments.indexOf('e');
  if (eventIndex != -1 &&
      segments.length > eventIndex + 3 &&
      segments[eventIndex + 3].toLowerCase() == 'listen') {
    return ListenerLink(
      serverUrl: _origin(uri),
      eventSlug: segments[eventIndex + 1],
      channelSlug: segments[eventIndex + 2],
      originalUrl: uri,
    );
  }

  throw const FormatException('This does not look like an UnderSound listener link.');
}
```

## Suggested API Client Changes

Replace `loadPublicChannel` with:

```dart
Future<PublicChannelContext> loadPublicChannel(ListenerLink link) async {
  final uri = link.serverUrl.replace(
    path: '/api/public/listen/${Uri.encodeComponent(link.eventSlug)}/${Uri.encodeComponent(link.channelSlug)}',
  );

  final response = await _get(uri);
  final json = _decode(response);
  return PublicChannelContext.fromJson(json);
}
```

Replace LiveKit token fetch with a POST:

```dart
Future<LiveKitTokenResponse> fetchListenerToken({
  required ListenerLink link,
  String? identity,
}) async {
  final uri = link.serverUrl.replace(path: '/api/livekit/listener-token');
  final response = await _postJson(uri, {
    'eventSlug': link.eventSlug,
    'channelSlug': link.channelSlug,
    if (identity != null) 'identity': identity,
  });

  final json = _decode(response);
  return LiveKitTokenResponse.fromJson(json);
}
```

## Suggested Public Models

The current mobile `PublicEvent.fromJson` expects `name`, `publicDescription`, and `id`. Studio v2 returns `title`, `slug`, and public flags.

Update it to accept both:

```dart
name: (json['title'] ?? json['name'] ?? 'UnderSound').toString(),
id: (json['id'] ?? json['slug'] ?? '').toString(),
description: (json['description'] ?? json['publicDescription'] ?? json['location'] ?? '').toString(),
```

The current mobile `PublicChannel.fromJson` expects `id` and `name`. Studio v2 returns `slug` and `name`.

Update it to accept:

```dart
id: (json['id'] ?? json['slug'] ?? '').toString(),
name: (json['name'] ?? json['languageLabel'] ?? 'Audio').toString(),
```

Also store these optional fields if useful:

- `slug`
- `languageCode`
- `languageLabel`
- `webrtcEnabled`
- `hlsEnabled`
- `icecastFallbackUrl`
- `listenerTokenMode`

## HLS/Fallback Notes

Studio v2 does not currently provide the old HLS status endpoint:

```text
GET /api/channels/:channelId/hls?token=:token
```

For now:

- prefer WebRTC via LiveKit
- if `channel.icecastFallbackUrl` is present, use it as the fallback stream URL
- do not require `token` for public listener links

## LAN And Cloud Notes

Studio v2 returns browser/device-reachable URLs:

- local LAN: `http://192.168.x.x:3000` app links and `ws://192.168.x.x:7880` LiveKit URLs
- cloud: `https://studio.example.com` app links and `wss://livekit.example.com` LiveKit URLs

The mobile app should not rewrite these hosts unless the user explicitly changes server settings.

## Compatibility Checklist

- [ ] QR scan accepts `/listen/:eventSlug/:channelSlug`.
- [ ] Manual link entry accepts `/listen/:eventSlug/:channelSlug`.
- [ ] Old `/listener/:eventSlug/:channelSlug` links work.
- [ ] Optional old `/e/:event/:channel/listen?token=...` links still parse as legacy.
- [ ] Mobile calls `GET /api/public/listen/:eventSlug/:channelSlug`.
- [ ] Mobile calls `POST /api/livekit/listener-token`.
- [ ] WebRTC playback uses the returned `url` and `token`.
- [ ] Public metadata parsing handles `event.title` and `channel.slug`.
- [ ] Fallback stream uses `channel.icecastFallbackUrl` when present.
- [ ] No mobile code expects listener token query params in the QR URL.
