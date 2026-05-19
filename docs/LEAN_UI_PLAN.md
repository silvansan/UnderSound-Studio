# Lean UI build plan

Goal: fewer duplicate panels and routes, same workflows for volunteers (events, channels, users, QR, listen/speak).

## Phase 1 — Dashboard & shell
- [x] Dashboard: stat cards only + compact “recent” links
- [x] `hideHeader` / `hideFooter` on main app pages
- [x] Single Payload Admin entry (sidebar only for super_admin)

## Phase 2 — Detail pages
- [x] Event/channel detail slimmed; QR via popups
- [x] Link “All channels” from event detail

## Phase 3 — Dead code & rows
- [x] Removed unused card/drawer components
- [x] Row click to open; delete only where permitted

## Phase 4 — Users & assignments
- [x] Users: org tabs only (no hero)
- [x] Event settings: read-only team + link to `/users`

## Phase 5 — Create flows & settings
- [x] Create event/channel: forms only
- [x] Settings: deployment notes for super_admin only

## Phase 6 — Organization drawer & speak QR
- [x] Single **Organization actions** drawer with **tabs** (Invite | Request | Create | Manage)
- [x] Speak page: `QRPopup` + open link (removed `QRActionCard`)

## Phase 7 — Long lists (`TruncatedList` + `SectionTabs`)
- [x] Shared `TruncatedList` (12 items, then “Show more”) in `src/lib/list-ui.ts`
- [x] **Events** list + status filter chips (All / Active / Draft / Archived)
- [x] **Channels** list
- [x] **Event detail** channel list
- [x] **Users**: pending requests, pending invites, members
- [x] **Organization actions** → Manage tab (org list)
- [x] **Event assignments** (settings drawer) and **per-user event access**
- [x] **Profile**: `hideHeader` / `hideFooter`, no intro paragraphs

## Verification
- [x] `npm run build`
- Public routes unchanged: `/listen`, `/speak`, API, Android QR format

## Pattern for new lists
Wrap row/line enumerations in `<TruncatedList itemLabel="…" listClassName="space-y-2">` (use `as="ul"` when children are `<li>`).

Use `<SectionTabs tabs={[…]} />` when one panel has multiple unrelated forms (like organization actions).
