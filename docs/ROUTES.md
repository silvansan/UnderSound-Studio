# Routes

Short route map for the app and public compatibility surfaces.

## App Routes

- `/`: login page for unauthenticated users; redirects authenticated users to `/dashboard`.
- `/dashboard`: app dashboard.
- `/events`: event list, supports `?status=active|draft|archived`.
- `/events/new`: create event.
- `/events/:eventSlug`: event overview.
- `/events/:eventSlug/edit`: edit event.
- `/events/:eventSlug/settings`: event settings and assignments.
- `/events/:eventSlug/channels`: channel list for an event.
- `/events/:eventSlug/channels/new`: create channel.
- `/events/:eventSlug/channels/:channelSlug`: channel overview.
- `/events/:eventSlug/channels/:channelSlug/edit`: edit channel.
- `/channels`: global list of accessible channels.
- `/users`: organization-aware user management (`?organization={slug}`).
- `/settings`: site settings, config import/export, and admin links.

## Public Routes

- `/listen/:eventSlug/:channelSlug`: public listener page.
- `/speak/:eventSlug/:channelSlug`: public speaker page.

These routes must stay stable for QR codes and Android app compatibility.

## Payload Routes

- `/admin`: Payload admin, super-admin only.
- `/api/[...slug]`: Payload REST API.
- `/api/graphql`: Payload GraphQL API.
- `/api/graphql-playground`: Payload GraphQL playground.

## App API Routes

- `POST /api/app/reset-password`: app password reset; verifies invited users on success.
- `POST /api/app/login-failure`: returns clearer login errors for inactive or unverified accounts.
- `GET /api/health`: health check.
- `GET /api/events/:eventSlug/channels`: public channel list for an active event.
- `GET /api/public/listen/:eventSlug/:channelSlug`: public listener metadata.
- `GET /api/public/speak/:eventSlug/:channelSlug`: public speaker metadata.
- `POST /api/livekit/listener-token`: server-side listener token.
- `POST /api/livekit/speaker-token`: server-side speaker token.
- `POST /api/speaker/verify-password`: speaker password verification.
- `GET /api/config/export?scope=events|channels|full`: authenticated config export.
- `POST /api/users/invite`: authenticated user invitation API.

## Compatibility Redirects

- `/event/:eventSlug` -> `/events/:eventSlug`
- `/event/:eventSlug/channel/:channelSlug` -> `/events/:eventSlug/channels/:channelSlug`
- `/listener/:eventSlug/:channelSlug` -> `/listen/:eventSlug/:channelSlug`
- `/speaker/:eventSlug/:channelSlug` -> `/speak/:eventSlug/:channelSlug`
