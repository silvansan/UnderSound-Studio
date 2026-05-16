<p align="center"><img width="200" height="200" alt="UnderSound-Logo" src="https://github.com/user-attachments/assets/e68fc02b-344d-4800-b52c-8f21df0b063a" /></p>


# UnderSound-Studio

> Modern live translation & low-latency event audio platform built with Payload CMS 3, Next.js, TypeScript, LiveKit, and Docker.

---

## 🎧 What is UnderSound-Studio?

**UnderSound-Studio** is the next-generation rebuild of the UnderSound ecosystem — designed for:

* 🌍 Real-time multilingual event translation
* 🎤 Speaker & interpreter audio routing
* 📱 Mobile-friendly listener experience
* ⚡ Ultra low-latency streaming with WebRTC
* 🐳 Easy self-hosted Docker deployment
* 🔐 Modern authentication & event management
* 🧩 Payload CMS-powered administration

Built for churches, conferences, live productions, and multilingual events.

---

# ✨ Features

## Current Foundation (Phase 0)

* ✅ Payload CMS 3 integration
* ✅ Next.js App Router
* ✅ TypeScript-first architecture
* ✅ Dockerized stack
* ✅ PostgreSQL support
* ✅ Optional SQLite local development
* ✅ Event / listener / speaker route placeholders
* ✅ LiveKit integration stubs
* ✅ QR code & invite link utilities
* ✅ Email service scaffolding
* ✅ Permission & role system groundwork

---

# 🧱 Tech Stack

| Layer            | Technology              |
| ---------------- | ----------------------- |
| Frontend         | Next.js 15 + React      |
| CMS              | Payload CMS 3           |
| Language         | TypeScript              |
| Realtime Audio   | LiveKit + WebRTC        |
| Database         | PostgreSQL / SQLite     |
| Containerization | Docker + Docker Compose |
| Authentication   | Payload Auth            |
| Email            | Nodemailer / SMTP       |
| Styling          | Tailwind CSS            |

---

# 🚀 Quick Start (Local Development)

## 1. Clone the repository

```bash
git clone https://github.com/silvansan/UnderSound-Studio.git
cd UnderSound-Studio
```

---

## 2. Create environment file

```bash
cp .env.example .env
```

SMTP setup help:

```text
docs/SMTP_SETUP.md
```

---

## 3. Start development services

### PostgreSQL

```bash
docker compose -f docker-compose.dev.yml up -d db
```

### Optional Maildev

```bash
docker compose -f docker-compose.dev.yml --profile mail up -d maildev
```

Maildev UI:

```text
http://localhost:1080
```

---

## 4. Install dependencies

```bash
npm install
```

---

## 5. Run development server

```bash
npm run dev
```

---

## 6. Open the app

Frontend:

```text
http://localhost:3000
```

Payload Admin:

```text
http://localhost:3000/admin
```

---

# 🗄 SQLite Mode (Optional)

Perfect for lightweight local testing.

Set inside `.env`:

```env
PAYLOAD_DATABASE=sqlite
DATABASE_URI=file:./data/undersound.db
```

---

# 🐳 Docker Production Stack

## Start production-style environment

```bash
cp .env.example .env
```

Edit secrets and domain URLs inside `.env`, then:

```bash
docker compose up --build
```

---

## Included Services

| Service   | Purpose                       |
| --------- | ----------------------------- |
| `app`     | Next.js + Payload application |
| `db`      | PostgreSQL database           |
| `maildev` | Optional local email testing  |

---

## Persistent Volumes

| Volume               | Description             |
| -------------------- | ----------------------- |
| `undersound_db`      | PostgreSQL data         |
| `undersound_uploads` | Uploaded media & assets |

---

# 📁 Project Structure

```text
src/
├── app/                # Next.js routes
├── collections/        # Payload collections
├── globals/            # Payload globals
├── lib/
│   ├── livekit/        # LiveKit utilities
│   ├── qr/             # QR code helpers
│   ├── email/          # Email helpers
│   ├── permissions/    # Access control
│   └── links/          # Invite links
├── components/         # Shared UI components
└── styles/             # Global styling
```

---

# 🛣 Planned Architecture

## Listener Flow

```text
QR Code → Event Page → Channel Selection → WebRTC Audio
```

---

## Speaker / Interpreter Flow

```text
Login → Speak Page → Select Channel → Publish Audio
```

---

## Admin Flow

```text
Payload Admin → Create Event → Generate Channels → Share QR Codes
```

---

# 🔐 Planned Features

## Authentication

* Email login
* Magic links
* 2FA support
* Event invitations
* Role-based access

---

## Audio

* WebRTC primary streaming
* HLS / Icecast fallback
* Dynamic channels
* Low-latency monitoring
* Mobile background playback

---

## Events

* Multi-language rooms
* QR code access
* Public/private events
* Speaker permissions
* Listener analytics

---

# 📚 Development Roadmap

See:

```text
AGENTS.md
```

For the complete phased implementation plan.

---

# 🤝 Contributing

Contributions, ideas, testing, and architecture discussions are welcome.

```bash
git checkout -b feature/my-feature
```

Then open a pull request.

---

# 📄 License

MIT License

---

# ❤️ Vision

UnderSound-Studio aims to become an open, self-hosted platform for multilingual live events — simple enough for churches, powerful enough for conferences, and flexible enough for production environments.

---

# 🌐 Future Goals

* OBS / vMix integrations
