# Local Docker build and test

Use this before Portainer or production deployment.

## Prerequisites

- Docker Desktop (or Docker Engine + Compose v2)
- Copy `.env.example` → `.env` and set at minimum:
  - `PAYLOAD_SECRET` (32+ random characters)
  - `POSTGRES_PASSWORD`
  - `LIVEKIT_API_SECRET`
  - `INITIAL_SUPER_ADMIN_EMAIL` / `INITIAL_SUPER_ADMIN_PASSWORD` (first boot only)

Optional local email testing:

```bash
docker compose --profile mail up -d
```

Maildev UI: http://localhost:1080 (SMTP on port 1025).

## Build and start

From the project root (this repository folder):

```bash
cp .env.example .env
# Edit .env — set PAYLOAD_SECRET, POSTGRES_PASSWORD, and admin bootstrap credentials
docker compose build
docker compose up -d
```

Ensure `.env` uses `POSTGRES_USER=ablaut`, `POSTGRES_DB=ablaut`, and  
`DATABASE_URI=postgres://ablaut:<password>@db:5432/ablaut` when the app runs inside Compose  
(`localhost` in `DATABASE_URI` is only for `npm run dev` on the host talking to a published `5432` port).

Rebuild after code changes:

```bash
docker compose up -d --build
```

## Phone / tablet testing on the same Wi‑Fi

`localhost` only works on this computer. To test the listener page (WebRTC lock screen, etc.) on Android or iPhone:

```bash
npm run lan:urls
```

Open the printed **App** URL on your phone (example: `http://192.168.1.50:3000/listen/...`).

The app rewrites LiveKit/HLS URLs to match the host your phone uses, even if `.env` still says `localhost`.

Optional — write LAN URLs into `.env` and restart:

```bash
npm run lan:urls -- --write-env
docker compose up -d --build app
```

**Windows Firewall:** allow inbound **TCP** `3000`, `7880`, `7881` and **UDP** `50000-50100` when prompted.

**Requirements:** phone and PC on the same network.

**Recommended split setup (speaker on PC, listener on phone):**

| Device | URL | Why |
|--------|-----|-----|
| **PC — speaker / publish** | `http://localhost:3000/speak/...` | Microphone works (`localhost` is trusted) |
| **Phone — listener** | `http://192.168.x.x:3000/listen/...` | Reachable on Wi‑Fi (see HTTPS/Chrome flag below for WebRTC) |

You do **not** need the same URL on both devices. Both connect to the same LiveKit room on your PC.

If you open the **speaker page via LAN IP on the PC** (`http://192.168.x.x`), the browser will **block the microphone** — same as on the phone.

### Phone cannot open the page at all (connection timeout / refused)

Docker **is** allowed on LAN (`0.0.0.0:3000`). On Windows, **Windows Firewall** usually blocks other devices (your phone) even when `localhost` works on the PC.

**1. Diagnose on the PC:**

```bash
npm run lan:doctor
```

**2. On the PC browser**, open `http://192.168.x.x:3000/api/health` (use your LAN IP from `npm run lan:urls`). If that works on the PC but **not on the phone**, it is almost certainly firewall or Wi‑Fi isolation.

**3. Open Windows Firewall (run PowerShell as Administrator):**

```powershell
cd ablaut-studio
Set-ExecutionPolicy -Scope Process Bypass -Force
.\scripts\open-lan-firewall.ps1
```

**4. On the phone** (same Wi‑Fi, not guest network, mobile data off), open:

`http://192.168.x.x:3000/api/health`

You should see JSON like `{"ok":true,...}`.

**Also check:**

- Phone and PC on the **same** Wi‑Fi band/network (guest Wi‑Fi often blocks device-to-device traffic).
- Router setting **AP isolation / client isolation** disabled.
- VPN off on PC and phone.
- Docker Desktop → Settings → Resources → Network (default is fine; no “localhost only” for published ports).

If firewall + same Wi‑Fi still fails, use **ngrok** (HTTPS tunnel) — see below — which bypasses LAN/firewall entirely.

### Microphone / WebRTC require HTTPS (or a dev flag)

Browsers only treat **`https://`** and **`http://localhost`** as secure. A LAN URL like `http://192.168.1.50:3000` is **not** trusted, so:

- **Speaker page** — microphone blocked  
- **WebRTC listener** — connection often blocked on phone browsers  

There is **no normal “add to trusted sites” toggle** for HTTP mic access. Use one of these instead:

#### Option A — Android Chrome dev flag (easiest on same Wi‑Fi)

1. On the phone, open `chrome://flags`
2. Enable **Insecure origins treated as secure**
3. Add your LAN app URL, e.g. `http://192.168.1.50:3000`
4. **Relaunch Chrome**, then open the listener/speaker URL again

Run `npm run lan:urls` to print the exact URL for your PC.

Dev-only — do not ask end users to do this.

#### Option B — HTTPS tunnel (works on iPhone + Android)

Use [ngrok](https://ngrok.com/) or [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/) so the phone gets an **`https://`** URL:

```bash
# Terminal 1 — app
ngrok http 3000

# Terminal 2 — LiveKit
ngrok http 7880
```

Put the **https** app URL in `PUBLIC_BASE_URL` / `NEXT_PUBLIC_APP_URL` and the **wss** LiveKit URL in `LIVEKIT_PUBLIC_URL`, then restart:

```bash
docker compose up -d --build app
```

Open the **ngrok https URL** on the phone (not the LAN http URL).

#### Option C — Use the Flutter app

The native **ablaut-app** already handles background audio and secure contexts; use it when browser HTTP limits get in the way.

## Smoke test

| Check | URL / command |
|-------|----------------|
| Health | http://localhost:3000/api/health → `{"ok":true,"service":"ablaut",...}` |
| Login | http://localhost:3000 |
| LiveKit | Port `7880` open; `LIVEKIT_URL=ws://localhost:7880` in `.env` |
| Maildev (optional) | http://localhost:1080 |

```bash
docker compose ps
docker compose logs app --tail 50
```

## Volumes (do not delete on redeploy)

- `ablaut_db` — PostgreSQL
- `ablaut_uploads` — media uploads

## Stop

```bash
docker compose down
```

Data persists in named volumes `ablaut_db` and `ablaut_uploads`.

Use `docker compose down -v` only if you intend to wipe local data (safe when you have no deployment to preserve).

## Next: deployment

- General ops: [DEPLOYMENT.md](./DEPLOYMENT.md)
- Portainer: [PORTAINER.md](./PORTAINER.md) and `PORTAINER_EASY_STACK_DEPLOYMENT.md` in the repo root
