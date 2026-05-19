# Migration To ablaut

ablaut supports two data migration paths:

- **Database backup/restore** — preserve users, password hashes, events, channels, assignments, settings, and IDs exactly.
- **JSON config import/export** — portable transfer via Settings. Imported users get random passwords and must activate or reset before login.

## Docker defaults (all new stacks)

| Item | Value |
|------|--------|
| Postgres user | `ablaut` |
| Postgres database | `ablaut` |
| `DATABASE_URI` | `postgres://ablaut:<password>@db:5432/ablaut` |
| DB volume | `ablaut_db` |
| Uploads volume | `ablaut_uploads` |
| Suggested stack name | `ablaut-studio` |

Copy `.env.example` to `.env` and set `POSTGRES_PASSWORD`, `PAYLOAD_SECRET`, and public URLs before the first deploy.

### Reset local Docker data (dev only)

If you previously ran a stack with other volume or database names and have no data to keep:

```bash
docker compose down -v
docker compose up -d --build
```

That creates fresh `ablaut_db` and `ablaut_uploads` volumes.

## Backup and restore

Back up before major upgrades:

```bash
docker compose exec db pg_dump -U ablaut ablaut > ablaut-backup.sql
docker run --rm -v ablaut_uploads:/data -v "$PWD":/backup alpine tar czf /backup/ablaut_uploads.tgz -C /data .
```

Restore:

```bash
docker compose stop app
docker compose exec -T db psql -U ablaut ablaut < ablaut-backup.sql
docker run --rm -v ablaut_uploads:/data -v "$PWD":/backup alpine sh -c "cd /data && tar xzf /backup/ablaut_uploads.tgz"
docker compose up -d app
```

If Portainer prefixes volume names with the stack name, confirm the actual volume names in the UI before backup/restore.

## JSON Config Import

The app includes a Settings import/export panel:

- Admins can export/import event and channel configuration they are allowed to manage.
- Super admins can export/import full site configuration.
- Full config exports include organizations, organization memberships, non-secret user data, events (with `organizationSlug`), and event assignments.
- User password hashes, API secrets, SMTP secrets, and LiveKit secrets are not exported.
- Listener/speaker password values are exported only as stored hashes.
- Imported users are created with random passwords and should use password reset/activation before logging in.

New exports use:

```json
{
  "kind": "ablaut-config",
  "version": 2,
  "organizations": [],
  "organizationMemberships": [],
  "users": [],
  "events": [],
  "channels": [],
  "assignments": []
}
```

Legacy files with `kind: "legacy-v1-config"` (or the older v1 export discriminator) or `version: 1` without organizations are still accepted.

## Old export script

```bash
npm run payload -- run scripts/migrate-legacy-export.ts -- --input ./legacy-export.json --dry-run
npm run payload -- run scripts/migrate-legacy-export.ts -- --input ./legacy-export.json --uploads-dir ./old-uploads
```

The script accepts either an array of old events or an object with settings and events. See the script source for the expected JSON shape.
