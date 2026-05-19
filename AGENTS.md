You are working on a new repo for ablaut v2.

Project goal:
Rebuild ablaut as a clean Payload CMS 3 + Next.js + TypeScript app, while keeping compatibility with the current ablaut Android app, QR links, LiveKit workflow, and Docker/Portainer deployment.

Use:
- Payload CMS 3
- Next.js
- TypeScript
- Tailwind CSS
- PostgreSQL preferred, SQLite acceptable for local dev
- LiveKit server SDK
- Docker / Docker Compose / Portainer-friendly deployment

Important:
Payload already supports authentication collections, secure HTTP-only cookies, JWT/API keys, verify/reset-password auth operations, and collection/field/global access control. Use those instead of inventing a custom auth system. Payload docs confirm support for auth strategies, verification/reset flows, and access control. 
Sources:
- https://payloadcms.com/docs/authentication/overview
- https://payloadcms.com/docs/authentication/operations
- https://payloadcms.com/docs/access-control/overview
- https://payloadcms.com/docs/access-control/collections
- https://payloadcms.com/docs/configuration/collections

Do NOT break:
- Existing Android app listener links
- Existing QR-code listener structure
- Existing LiveKit room/token logic
- Speaker/listener public routes
- Docker/Portainer deployment simplicity

Main idea:
ablaut is an event-based live translation/audio system.
Admins create events.
Events contain channels.
Channels have listener links, speaker links, QR codes, and LiveKit room/token generation.
Listeners scan QR codes.
Speakers/translators use protected speaker pages.
Moderators manage assigned events only.

PHASE 0 — Create the new base app

1. Create a new repo:
   ablaut-v2

2. Scaffold Payload CMS 3 with Next.js and TypeScript.

3. Add Docker support:
   - Dockerfile
   - docker-compose.yml
   - .env.example
   - persistent volumes

4. Required services:
   - app
   - database
   - optional maildev for local email testing
   - optional LiveKit connection through env vars

5. Required env variables:
   PAYLOAD_SECRET=
   DATABASE_URI=
   NEXT_PUBLIC_APP_URL=
   PUBLIC_BASE_URL=
   LIVEKIT_API_KEY=
   LIVEKIT_API_SECRET=
   LIVEKIT_URL=
   SMTP_HOST=
   SMTP_PORT=
   SMTP_USER=
   SMTP_PASS=
   SMTP_FROM=
   INITIAL_SUPER_ADMIN_EMAIL=
   INITIAL_SUPER_ADMIN_PASSWORD=

6. Add clean folder structure:

   src/
   ├─ app/
   │  ├─ (admin)/
   │  ├─ events/
   │  ├─ listen/
   │  ├─ speak/
   │  └─ api/
   ├─ collections/
   │  ├─ Users.ts
   │  ├─ Events.ts
   │  ├─ Channels.ts
   │  ├─ EventAssignments.ts
   │  └─ AuditLogs.ts
   ├─ globals/
   │  └─ SiteSettings.ts
   ├─ access/
   │  ├─ isSuperAdmin.ts
   │  ├─ isAdmin.ts
   │  ├─ isModerator.ts
   │  ├─ canManageEvent.ts
   │  └─ canReadEvent.ts
   ├─ lib/
   │  ├─ livekit.ts
   │  ├─ qrcode.ts
   │  ├─ links.ts
   │  ├─ email.ts
   │  └─ permissions.ts
   ├─ components/
   │  ├─ EventCard.tsx
   │  ├─ ChannelCard.tsx
   │  ├─ QRDrawer.tsx
   │  ├─ Logo.tsx
   │  └─ Layout.tsx
   └─ styles/

PHASE 1 — Branding and design

1. Add the new ablaut logo as the main app logo.
2. Use the logo colors as the app palette:
   - dark alpine green
   - medium green
   - light crude green
   - water blue
   - dark blue
   - soft background
   - card background

3. Create CSS variables:

   --us-green-dark
   --us-green
   --us-green-light
   --us-blue
   --us-blue-dark
   --us-bg
   --us-card
   --us-text
   --us-muted
   --us-danger
   --us-warning

4. Apply the palette to:
   - header
   - sidebar
   - dashboard cards
   - event cards
   - channel cards
   - buttons
   - QR drawers
   - login page
   - speaker page
   - listener page

5. UI style:
   - modern
   - rounded corners
   - clean dashboard
   - mobile-friendly
   - large touch-friendly buttons
   - dark/light mode later if easy, but not required in phase 1

PHASE 2 — Payload auth foundation

Use Payload auth instead of building custom auth manually.

1. Create Users collection with auth enabled.

2. User fields:
   - email
   - name
   - role:
     - super_admin
     - admin
     - moderator
   - active
   - preferredLanguage
   - lastLogin
   - createdAt
   - updatedAt

3. Enable:
   - email/password login
   - email verification
   - password reset
   - account lockout if available
   - secure cookie/session behavior
   - HTTP-only cookies

4. Add email templates for:
   - email verification
   - password reset
   - invited user activation
   - optional 2FA code later

5. Add SMTP configuration through env variables.

6. Create initial super admin on first boot if no user exists:
   INITIAL_SUPER_ADMIN_EMAIL
   INITIAL_SUPER_ADMIN_PASSWORD

7. Never store plain passwords.

8. Never expose secrets to the browser.

PHASE 3 — Roles and permissions

Implement role-based access control using Payload access functions.

Roles:

1. super_admin
   - full access to everything
   - manage users
   - manage all events
   - manage global settings
   - delete anything

2. admin
   - create events
   - edit/delete own or assigned events
   - assign moderators to events
   - create/edit/delete channels inside accessible events
   - cannot change super_admin users

3. moderator
   - can only see assigned events
   - can create/edit/delete channels inside assigned events
   - can view event QR links
   - can manage speaker/listener links for assigned events
   - cannot create global events unless assigned permission exists
   - cannot manage users globally

Optional later:
4. viewer/helper
   - read-only assigned event access

Access helpers:
- isSuperAdmin
- isAdmin
- isModerator
- canReadEvent
- canManageEvent
- canManageChannel
- canAssignModerators

PHASE 4 — Main data model

Create these Payload collections:

1. Events

Fields:
- title
- slug
- description
- status:
  - draft
  - active
  - archived
- eventLogo
- dateStart
- dateEnd
- location
- publicListenerEnabled
- listenerPasswordEnabled
- listenerPasswordHash if needed
- speakerPasswordEnabled
- speakerPasswordHash or per-channel speaker password
- defaultLanguage
- createdBy
- assignedAdmins
- assignedModerators
- channels relationship
- qrSettings
- themeOverride optional

Routes:
- /events/:eventSlug
- /events/:eventSlug/settings
- /events/:eventSlug/channels

2. Channels

Fields:
- event relationship
- name
- slug
- languageCode
- languageLabel
- roomName
- livekitRoomName
- enabled
- sortOrder
- speakerPageEnabled
- listenerPageEnabled
- speakerPasswordEnabled
- speakerPasswordHash optional
- listenerTokenMode:
  - public
  - password
  - private
- hlsEnabled
- webrtcEnabled
- icecastFallbackUrl optional
- description
- createdBy

Routes:
- /events/:eventSlug/channels/:channelSlug
- /listen/:eventSlug/:channelSlug
- /speak/:eventSlug/:channelSlug

3. EventAssignments

Fields:
- user
- event
- roleForEvent:
  - admin
  - moderator
  - viewer
- permissions:
  - canEditEvent
  - canCreateChannels
  - canDeleteChannels
  - canViewQR
  - canManageSpeakerPassword

4. AuditLogs

Fields:
- user
- action
- collection
- documentId
- event
- channel
- metadata
- createdAt

5. SiteSettings global

Fields:
- siteName
- defaultLogo
- defaultThemeColors
- publicBaseUrl
- supportEmail
- allowPublicListenerPages
- requireEmailVerification
- livekitPublicUrl
- defaultQrStyle
- defaultTokenExpiry

PHASE 5 — Routing and refresh fix

Current problem:
When refreshing an event page, the app returns to the main page.

Fix:
Use real Next.js routes, not only frontend state/hash navigation.

Required routes:
- /dashboard
- /events
- /events/:eventSlug
- /events/:eventSlug/settings
- /events/:eventSlug/channels
- /events/:eventSlug/channels/:channelSlug
- /listen/:eventSlug/:channelSlug
- /speak/:eventSlug/:channelSlug
- /admin/users
- /settings

Rules:
1. Refreshing an event page must keep the user on the same event.
2. Refreshing a channel page must keep the user on the same channel.
3. Listener pages must not require admin login unless explicitly configured.
4. Speaker pages may require speaker password and/or admin/moderator login depending on event settings.
5. Add compatibility redirects for old URLs if possible.
6. If old QR links exist, preserve them or redirect them cleanly.

PHASE 6 — QR code behavior

1. QR codes must not all be visible at once.
2. On event pages, use drawers/accordions:
   - Show listener QR
   - Hide listener QR
   - Show speaker QR
   - Hide speaker QR

3. On channel pages, use separate QR drawers:
   - Listener QR
   - Speaker QR
   - Mobile app QR if different

4. QR links must keep compatibility with the Android app.

5. QR code colors should use the ablaut logo palette:
   - dark green foreground
   - light/white background
   - optional blue accent if QR library supports it safely

6. QR codes must include:
   - copy link button
   - download PNG button
   - open link button

PHASE 7 — LiveKit integration

1. Implement server-side LiveKit token generation only.
2. Never expose LIVEKIT_API_SECRET to the frontend.
3. Add API routes:

   POST /api/livekit/listener-token
   POST /api/livekit/speaker-token
   GET /api/events/:eventSlug/channels
   GET /api/public/listen/:eventSlug/:channelSlug
   GET /api/public/speak/:eventSlug/:channelSlug

4. Token rules:
   - listener token can subscribe only
   - speaker token can publish audio
   - speaker token can optionally subscribe for monitor mode
   - token expiry configurable
   - room name stable and deterministic

5. Suggested room naming:
   ablaut_\{eventSlug}_{channelSlug}

6. Preserve current room naming if the existing Android app depends on it.

7. Add status fields if easy:
   - live/offline
   - active speakers
   - active listeners

PHASE 8 — Speaker page passwords

1. Speaker pages should optionally require password.
2. Password can be:
   - event-level speaker password
   - channel-level speaker password
3. Store only hashed speaker passwords.
4. Admins/moderators can regenerate speaker passwords.
5. Speaker page flow:
   - open speaker link
   - if password required, ask for password
   - after success, show publish controls
6. Add session/cookie so speaker does not re-enter password on every refresh.
7. Do not confuse speaker password with user login.
8. Speaker page audio-quality UI should include future buttons/sliders/checkboxes for:
   - echo cancellation off/on, default off
   - noise suppression off/on, default off
   - auto gain control off/on, default off
   - optional input gain/level guidance if implemented safely
   These browser capture effects must default to off, especially for music, because they can distort translated audio or musical content.

PHASE 9 — Listener page behavior

1. Listener page should be simple and mobile-first.
2. It should show:
   - event name
   - channel name
   - language
   - connect button
   - WebRTC as primary
   - fallback button if configured

3. The Android app should still be able to open listener links from QR codes.

4. Listener page should not expose admin data.

5. Optional:
   - If listener password is enabled, ask for password first.
   - Save selected channel in local storage.
   - Add “open in Android app” deep link later.

PHASE 10 — Better admin dashboard

Dashboard should have:

1. Main dashboard
   - active events
   - archived events
   - quick create event
   - recently edited channels
   - system status

2. Event detail page
   - event overview
   - channels list
   - add channel button
   - QR drawer section
   - assigned users
   - event settings

3. Channel detail page
   - channel settings
   - speaker link
   - listener link
   - QR drawers
   - LiveKit room name
   - fallback links
   - enable/disable channel

4. Users page
   - only super_admin can manage all users
   - admins can maybe invite moderators if allowed

5. Buttons should be arranged logically:
   - primary actions at top
   - dangerous actions at bottom
   - QR actions inside drawers
   - advanced settings collapsed

PHASE 11 — Email activation, invites, and 2FA preparation

1. Use Payload email verification for normal registration/login.
2. Add invite flow:
   - super_admin/admin creates user invitation
   - invited user gets activation email
   - user sets password
   - user verifies email
   - user can log in

3. Add password reset flow using Payload reset-password operation.

4. Add email templates:
   - verify account
   - reset password
   - invite user
   - speaker password changed
   - event assignment notification

5. Prepare for 2FA:
   - Add user fields:
     - twoFactorEnabled
     - twoFactorSecret encrypted if implemented
     - twoFactorMethod:
       - app
       - email
   - Do not implement full 2FA in the first pass unless simple and secure.
   - Leave clean TODO and structure.

PHASE 12 — Persistence and Portainer

1. Docker volumes must preserve:
   - database
   - uploads/media
   - generated files if any
   - logs if needed

2. Redeploying in Portainer must not reset:
   - users
   - passwords
   - events
   - channels
   - assignments
   - uploaded logos
   - settings

3. docker-compose.yml should clearly define volumes:
   - ablaut_db
   - ablaut_uploads

4. .env.example must document all required variables.

5. Add deployment docs:
   - first install
   - Portainer stack install
   - update existing deployment
   - backup database
   - restore database
   - SMTP setup
   - LiveKit setup
   - reverse proxy / HTTPS setup

PHASE 13 — App login, management UI, and speaker publishing UX

This phase takes priority before migration because the app shell currently exposes dashboard/event pages without a user login, and non-technical volunteers should not need to use Payload admin for normal event work.

Main goal:
Protect the main app behind Payload user authentication, keep only explicitly public listener/speaker routes open, and move day-to-day event/channel/user management into the branded app UI.

1. Main app authentication
   - `/` should lead to a branded login page when the user is not authenticated.
   - `/dashboard`, `/events`, `/events/:eventSlug`, `/events/:eventSlug/settings`, `/events/:eventSlug/channels`, `/events/:eventSlug/channels/:channelSlug`, `/settings`, and app-side `/users` routes must require a logged-in Payload user.
   - Use Payload auth/session cookies and existing role/access helpers; do not build a separate auth system.
   - Do not expose admin dashboard data to anonymous visitors.
   - Keep `/listen/:eventSlug/:channelSlug` public by default unless listener settings require password/private access.
   - Keep `/speak/:eventSlug/:channelSlug` public by default only when event/channel settings allow it, with speaker password support still separate from user login.
   - Preserve Android/QR listener compatibility.

2. Role-based app access
   - super_admin can access everything in the app.
   - only super_admin can access Payload admin.
   - admin can create/edit/delete events they own or are assigned to, manage channels inside accessible events, invite/manage moderators where allowed, and assign moderators.
   - moderator can only see assigned events and can create/edit/delete channels inside assigned events according to event assignment permissions.
   - In-app routes and server actions/API endpoints must enforce the same permissions as Payload access control.

3. App-side management UI
   - Add app UI for creating/editing/deleting events from `/events` and event detail/settings pages.
   - Add app UI for creating/editing/deleting channels inside accessible events.
   - Add app UI for assigning moderators/admins to events where permitted.
   - Keep dangerous actions clearly separated and confirmed.
   - Payload admin can remain available, but should be a separate "Payload Admin" button/link in the main menu.
   - Non-technical users should be able to do normal event/channel/user work without entering Payload admin.

4. App-side users page
   - Add `/users` or `/admin/users` app page for user management in the branded app UI.
   - super_admin can see and manage all users.
   - admin can invite/manage moderators only where allowed.
   - moderators cannot manage users globally.
   - Include user role, active state, invitation status, and assigned events where useful.

5. Payload admin convenience and branding
   - Add a clear link from Payload admin back to the app dashboard.
   - Add the ablaut logo/branding to Payload admin if supported cleanly.
   - Keep Payload admin as a super_admin-only advanced/back-office escape hatch, not the primary volunteer workflow.
   - Do not show Payload admin links to admin or moderator users.

6. Speaker page microphone publishing UI
   - Add a microphone input dropdown before publishing.
   - Enumerate available audio input devices in the browser.
   - Require a selected microphone or choose a sensible default before starting publish.
   - Start LiveKit publishing with the selected device.
   - Keep echo cancellation, noise suppression, and auto gain control defaulted off for music/translation quality.
   - Show clear connection/publishing status and errors on the speaker page.

7. Verification
   - Anonymous visitor to `/` sees login, not dashboard data.
   - Anonymous visitor to `/dashboard`, `/events`, `/settings`, and `/users` is redirected to login.
   - Anonymous listener route still opens when listener public access is enabled.
   - Anonymous speaker route still follows event/channel speaker settings and password flow.
   - super_admin sees dashboard, events, users, settings, and Payload Admin link.
   - admin sees only permitted event/user management actions.
   - moderator sees only assigned events and allowed channel actions.
   - speaker can select a microphone and publish audio.
   - Run lint and build.

PHASE 14 — Migration from legacy exports

1. Inspect legacy export data format.
2. Create migration script:
   scripts/migrate-legacy-export.ts

3. It should import:
   - old events
   - old channels
   - old logos/uploads if possible
   - old settings
   - old room names
   - old public links if possible

4. Do not import plain passwords directly.
5. If old users had unsafe passwords, force password reset.
6. Preserve old QR/listener links through redirects where possible.

PHASE 15 — API compatibility contract

Create docs/API.md.

Document:

1. Public listener routes used by Android app.

2. Public speaker routes.

3. LiveKit token endpoints.

4. QR link format.

5. Event/channel response format.

6. What is public and what requires authentication.

Important:
Do not change these routes once the Android app depends on them.

PHASE 16 — Security checklist

Implement:

1. HTTP-only secure cookies.
2. CSRF protection where needed.
3. Rate limiting for login/password reset/token endpoints.
4. Input validation.
5. Sanitized slugs.
6. No secrets in frontend bundle.
7. Role-based access control on every admin collection.
8. Public routes return only public fields.
9. Speaker passwords hashed.
10. Strong PAYLOAD_SECRET required.
11. HTTPS recommended in production.
12. Backups documented.
13. Audit logs for sensitive actions:
    - user created
    - role changed
    - event deleted
    - channel deleted
    - speaker password changed

PHASE 17 — Documentation for Codex and humans

Create:

docs/
├─ ARCHITECTURE.md
├─ API.md
├─ ROUTES.md
├─ LIVEKIT.md
├─ DEPLOYMENT.md
├─ PORTAINER.md
├─ SECURITY.md
├─ MIGRATION.md
└─ ANDROID_COMPATIBILITY.md

Each doc should be short and clear.

PHASE 18 — Testing checklist

Add manual testing checklist:

1. Create super admin.
2. Login.
3. Verify email.
4. Reset password.
5. Create admin.
6. Create moderator.
7. Create event.
8. Assign moderator to event.
9. Moderator logs in and sees only assigned event.
10. Create channel.
11. Open listener page.
12. Generate listener token.
13. Open speaker page.
14. Test speaker password.
15. Generate speaker token.
16. Scan QR code from Android app.
17. Refresh event page and stay on same page.
18. Redeploy stack in Portainer and confirm data persists.
19. Confirm old link redirects still work.
20. Confirm LiveKit secret is never visible in browser.

Implementation style:

- Do one phase at a time.

- Keep commits small.

- Do not rewrite everything at once.

- After each phase, run build and lint.

- Prefer clean, boring, stable code.

- Do not break public listener/speaker links.
