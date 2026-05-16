# Migration From Old UnderSound

Phase 14 starts with a JSON import script:

```bash
npm run payload -- run scripts/migrate-old-undersound.ts -- --input ./old-undersound-export.json --dry-run
npm run payload -- run scripts/migrate-old-undersound.ts -- --input ./old-undersound-export.json --uploads-dir ./old-uploads
```

The app also includes a Settings import/export panel:

- Admins can export/import event and channel configuration they are allowed to manage.
- Super admins can export/import full site configuration.
- User password hashes, API secrets, and LiveKit secrets are not exported.
- Listener/speaker password values are exported only as stored hashes.

The script accepts either an array of old events or an object with this shape:

```json
{
  "settings": {
    "siteName": "UnderSound",
    "publicBaseUrl": "https://example.com",
    "supportEmail": "support@example.com"
  },
  "events": [
    {
      "id": "old-event-id",
      "title": "Default event",
      "slug": "default",
      "description": "Optional description",
      "status": "active",
      "location": "Optional location",
      "defaultLanguage": "en",
      "publicListenerEnabled": true,
      "logo": "logos/default.png",
      "channels": [
        {
          "name": "English",
          "slug": "en",
          "languageCode": "en",
          "languageLabel": "English",
          "roomName": "old_room_name",
          "livekitRoomName": "old_room_name",
          "enabled": true
        }
      ]
    }
  ],
  "channels": []
}
```

Notes:

- Existing events/channels with the same slug are updated instead of duplicated.
- Event and channel slugs are preserved where provided.
- Old LiveKit room names are preserved through `roomName` / `livekitRoomName`.
- Old plain or hashed passwords are not imported. Recreate listener/speaker passwords in UnderSound v2.
- Old users are not imported automatically. Invite users again or force password resets before enabling old accounts.
- Logo/media files are imported when `logo` points to an existing file, either relative to the export file or under `--uploads-dir`.
