# Architecture

ablaut is a Payload CMS 3 + Next.js app for managing event-based live translation and audio.

## Runtime Pieces

- Next.js App Router serves the main app, public listener pages, public speaker pages, and API routes.
- Payload CMS owns authentication, collections, globals, admin UI, and generated REST/GraphQL APIs.
- PostgreSQL is the preferred database for production.
- Docker Compose runs the app and database with persistent named volumes.
- LiveKit tokens are generated server-side only.

## Main Data Model

- `users`: Payload auth users with `super_admin`, `admin`, and `moderator` roles.
- `events`: event records, public flags, speaker password hashes, QR settings, assigned users, and channels.
- `channels`: per-event listener/speaker stream configuration, LiveKit room names, route slugs, and access flags.
- `event-assignments`: per-event role and permission records.
- `audit-logs`: append-only security/activity records readable by super admins.
- `site-settings`: global branding, public URL, LiveKit public URL, and default token expiry.

## Access Model

- Super admins can manage everything and access Payload admin.
- Admins manage app-side events, channels, and moderators.
- Moderators manage channels inside assigned events only.
- Listener and speaker routes are public only when the event/channel settings allow them.

## Public Compatibility

Stable public routes are:

- `/listen/:eventSlug/:channelSlug`
- `/speak/:eventSlug/:channelSlug`

These routes are the QR and Android compatibility boundary. Avoid changing them; add redirects when old link shapes need support.
