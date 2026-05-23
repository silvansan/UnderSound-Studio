# Public API contract fixtures

These JSON files are the shared contract between **ablaut-studio** and **ablaut-app**.

When changing public listener metadata fields, update:

- `tests/fixtures/public-listen-channel.fixture.json` (this repo)
- `ablaut-app/app/test/fixtures/public_listen_channel.fixture.json`
- `ablaut-app/app/test/fixtures/public_listen_event_directory.fixture.json`
- `docs/API.md`

Run contract tests:

```bash
npm run test:int -- public-api.contract
```

In the mobile repo:

```bash
flutter test test/public_channel_contract_test.dart
```
