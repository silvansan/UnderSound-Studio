# Manual Testing Checklist

Use this checklist before releases, Portainer redeploys, or Android compatibility changes.

Record:

- Tester:
- Date:
- Build/commit:
- Environment:
- Result: Pass / Fail / Partial

## Auth And Users

- [ ] Create initial super admin from `INITIAL_SUPER_ADMIN_EMAIL` and `INITIAL_SUPER_ADMIN_PASSWORD`.
- [ ] Log in as super admin.
- [ ] Verify email flow works.
- [ ] Reset password flow works.
- [ ] Create an admin user.
- [ ] Create a moderator user.
- [ ] Confirm super admin can see and manage all users.
- [ ] Confirm admin can manage moderators but cannot access Payload admin.
- [ ] Confirm moderator cannot manage global users.
- [ ] Confirm inactive users cannot log in.
- [ ] Confirm repeated failed login attempts trigger Payload account lockout.

## Events And Permissions

- [ ] Create an event.
- [ ] Edit event title, slug, dates, location, language, and status.
- [ ] Assign moderator to the event.
- [ ] Log in as the moderator and confirm only assigned events are visible.
- [ ] Confirm moderator cannot edit/delete the event record itself unless permissions allow it.
- [ ] Delete an event and confirm it disappears from lists.
- [ ] Confirm event deletion writes an audit log.

## Channels

- [ ] Create a channel inside an event.
- [ ] Edit channel name, slug, language, sort order, enabled flag, and listener/speaker page flags.
- [ ] Confirm moderator can create/edit/delete channels inside assigned events.
- [ ] Confirm moderator cannot manage channels for unassigned events.
- [ ] Delete a channel and confirm it disappears from the event and global channel lists.
- [ ] Confirm channel deletion writes an audit log.

## QR And Links

- [ ] Open event listener QR drawer.
- [ ] Open event speaker QR drawer.
- [ ] Open channel listener QR drawer.
- [ ] Open channel speaker QR drawer.
- [ ] Copy listener link.
- [ ] Download listener QR PNG.
- [ ] Open listener link in a new tab.
- [ ] Copy speaker link.
- [ ] Download speaker QR PNG.
- [ ] Open speaker link in a new tab.
- [ ] Confirm old listener redirect works: `/listener/:eventSlug/:channelSlug`.
- [ ] Confirm old speaker redirect works: `/speaker/:eventSlug/:channelSlug`.

## Listener Page

- [ ] Open `/listen/:eventSlug/:channelSlug`.
- [ ] Confirm it shows event name, channel name, and language.
- [ ] Generate listener token by pressing connect.
- [ ] Confirm listener token can subscribe only.
- [ ] Confirm disabled/private/password listener modes do not expose a token.
- [ ] Confirm fallback link appears only when `icecastFallbackUrl` is configured.
- [ ] Refresh the listener page and confirm it stays on the same page.

## Speaker Page

- [ ] Open `/speak/:eventSlug/:channelSlug`.
- [ ] Confirm microphone selector appears when browser permissions allow it.
- [ ] Confirm speaker audio publishes with echo cancellation, noise suppression, and auto gain control off by default.
- [ ] Enable event-level speaker password and set a password.
- [ ] Confirm speaker page asks for password.
- [ ] Confirm wrong password fails.
- [ ] Confirm correct password sets access and survives refresh.
- [ ] Generate speaker token.
- [ ] Confirm speaker token can publish audio.
- [ ] Confirm speaker password change writes an audit log.

## Dashboard And Refresh

- [ ] Open `/dashboard`.
- [ ] Click active events card and confirm it opens `/events?status=active`.
- [ ] Click draft events card and confirm it opens `/events?status=draft`.
- [ ] Click archived events card and confirm it opens `/events?status=archived`.
- [ ] Click channels card and confirm it opens `/channels`.
- [ ] Open `/events/:eventSlug` and refresh; confirm it stays on the event.
- [ ] Open `/events/:eventSlug/channels/:channelSlug` and refresh; confirm it stays on the channel.
- [ ] Confirm public listener/speaker pages do not show logged-in menu when logged out.

## Config Import And Export

- [ ] Export event config as admin or super admin.
- [ ] Export channel config as admin or super admin.
- [ ] Export full config as super admin.
- [ ] Confirm non-super-admin cannot export full config.
- [ ] Import event/channel config into a test environment.
- [ ] Confirm exported config does not include plaintext passwords or secrets.
- [ ] Confirm speaker/listener password values, if present, are stored hashes only.

## LiveKit And Android Compatibility

- [ ] Confirm `LIVEKIT_API_SECRET` is not visible in browser source, network responses, or frontend bundle.
- [ ] Confirm public metadata endpoint returns only public fields.
- [ ] Confirm listener token endpoint is rate limited.
- [ ] Scan listener QR from Android app.
- [ ] Confirm Android opens the expected listener page/link.
- [ ] Confirm preserved room names still work when imported from old data.

## Deployment And Persistence

- [ ] Run `docker compose up -d --build`.
- [ ] Confirm app container is running.
- [ ] Confirm database container is healthy.
- [ ] Confirm `/api/health` returns `200`.
- [ ] Confirm security headers are present.
- [ ] Redeploy the stack in Portainer or Docker.
- [ ] Confirm users persist.
- [ ] Confirm passwords persist.
- [ ] Confirm events persist.
- [ ] Confirm channels persist.
- [ ] Confirm assignments persist.
- [ ] Confirm uploaded logos/media persist.
- [ ] Back up database.
- [ ] Restore database into a test stack.

## Notes

- Block release if public listener/speaker links break.
- Block release if LiveKit secrets appear in browser responses.
- Block release if super-admin-only Payload access can be reached by admin/moderator users.
- Block release if Docker/Portainer redeploy loses persistent data.
