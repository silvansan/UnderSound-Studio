# Security Checklist

Current security posture for UnderSound v2.

## Implemented

- Payload auth is used for app users.
- Payload login lockout is enabled:
  - 5 failed attempts
  - 15 minute lock duration
- Payload auth cookies are HTTP-only.
- Cookie `secure` behavior follows the configured public HTTPS URL.
- Main app routes require Payload login:
  - `/dashboard`
  - `/events`
  - `/channels`
  - `/users`
  - `/settings`
- Payload admin is super-admin only.
- Non-super-admin access to `/admin` and `/admin/*` redirects before Payload renders a no-access screen.
- Public listener/speaker routes do not expose admin data.
- LiveKit tokens are generated server-side only.
- `LIVEKIT_API_SECRET` is never exposed to the browser.
- Listener LiveKit token grants can subscribe but cannot publish.
- Speaker LiveKit token grants can publish audio.
- Speaker passwords are hashed.
- Speaker password success uses an HTTP-only session cookie.
- Production `PAYLOAD_SECRET` must be at least 32 characters.
- Role-based access is enforced through Payload collection/global access functions and app server actions.
- Config export does not include user password hashes, SMTP secrets, API secrets, or LiveKit secrets.
- Config export/import transfers listener/speaker passwords only as stored hashes.
- Basic security headers are set by `src/middleware.ts`:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: SAMEORIGIN`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), geolocation=(), microphone=(self)`
  - `Strict-Transport-Security` when the public URL is HTTPS
- Audit logs are written for sensitive changes:
  - user created
  - user role changed
  - user deleted
  - event deleted
  - channel deleted
  - speaker password changed

## Rate Limited

The app has in-memory per-IP rate limiting for:

- `POST /api/livekit/listener-token`
- `POST /api/livekit/speaker-token`
- `POST /api/speaker/verify-password`
- `POST /api/users/invite`
- `GET /api/config/export`

For multi-instance deployments, replace or extend this with shared Redis/proxy rate limiting.

## Reverse Proxy Rate Limits

Payload owns its auth routes, so production deployments should rate-limit these at the reverse proxy:

- `POST /api/users/login`
- `POST /api/users/forgot-password`
- `POST /api/users/reset-password`

Recommended starting policy:

- `POST /api/users/login`: 5 requests per minute per IP, burst 10.
- `POST /api/users/forgot-password`: 3 requests per 10 minutes per IP, burst 5.
- `POST /api/users/reset-password`: 5 requests per 10 minutes per IP, burst 5.
- Return `429 Too Many Requests` with `Retry-After` when exceeded.

## Still Recommended

- Put the app behind HTTPS in production.
- Add CSRF review before adding more cookie-authenticated write endpoints.
- Add backup monitoring and restore drills.
- Review security headers at the reverse proxy.
