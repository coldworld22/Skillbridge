# SkillBridge — multi-tenant learning + commerce platform

SkillBridge is a production-minded educational platform for running branded academies with **payments**, **live/online classes**, **assignments**, **certificates**, **role-based dashboards**, **messaging**, and **AI assistance**.

This repository is intentionally built like a real system (not a demo): tenant isolation enforced server-side, hardened request pipeline (CORS/host allowlists, rate limits, CSRF), modular backend boundaries, and multiple payment providers.

## Overview

**What it is**

- A Next.js web app (`frontend/`) backed by an Express/Knex API (`backend/`)
- Multi-tenant by domain/subdomain with membership + plan/entitlement enforcement
- Built for real-world constraints: money movement, concurrency, access control, and operational tooling

**Engineering highlights**

- Domain-modular API (`backend/src/modules/*`) with `routes → controller → service` layering
- JWT access tokens (+ refresh) with role/permission checks and token revocation via a blacklist table
- Tenant enforcement middleware: host-based resolution, membership checks, tenant status gates, quotas (`backend/src/services/entitlements.js`)
- Redis-backed sessions (Passport/OAuth + CSRF) so the API can scale horizontally
- Payments: Stripe, PayPal, bank transfer receipts, and crypto gateways (NOWPayments / Coinbase Commerce)
- Socket.IO realtime (chat/messages/notifications) + background jobs (reminders, cleanup)
- Postgres via Knex migrations/seeds, connection retry/backoff, and startup migration execution

## Architecture

```mermaid
flowchart LR
  browser[Browser] -->|HTTPS| nginx[Nginx (TLS + routing)]
  nginx --> web[Next.js 15 (frontend)]
  nginx --> api[Express API (/api)]
  api --> db[(PostgreSQL)]
  api <--> redis[(Redis: sessions/cache)]
  api <--> sio[Socket.IO (/socket.io)]
  api --> uploads[(Uploads/media)]
  api --> docs[Static docs (/docs)]
```

Key design points:

- **Tenant isolation** is derived from the request host (custom domains or `{tenant}.<apex>` subdomains) and enforced via middleware before mutating operations.
- **Security posture** is explicit: allowlisted origins, production host validation, per-client rate limiting, CSRF for unsafe requests, and restricted direct access to protected uploads.
- **Operational ergonomics**: health checks, admin-visible error logs, cache flush endpoints, and a boot-time migration strategy for simplified deployments.

## Features

- **Learning**: online classes + lessons, assignments/submissions, progress gating, certificates + templates, resource uploads
- **Commerce**: cart, coupons/offers, subscription plans + entitlements/quotas, invoices, payouts, multi-provider payments
- **Communication**: notifications, messaging + realtime chat, support/tickets, community discussions
- **Integrations**: OAuth login (Google/GitHub/Facebook/Apple), email/SMS providers, analytics/ads configuration, pluggable AI providers

## Tech Stack

- **Frontend**: Next.js 15, React 18, TailwindCSS, Zustand, SWR, i18next
- **Backend**: Node.js, Express, Knex, PostgreSQL, Redis, Passport, Socket.IO, Joi/Zod validation
- **Infra**: Docker Compose (Postgres 14, Redis 7, pgAdmin), Nginx, Let’s Encrypt automation scripts
- **Testing**: Jest + Supertest (backend), Jest + Testing Library (frontend), Playwright (repo-level)

## Setup

### Local (Docker Compose)

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local

docker-compose up --build
```

- Frontend: `http://localhost:3000`
- API: `http://localhost:5002/api`
- Docs (served by API): `http://localhost:5002/docs`
- pgAdmin: `http://localhost:5050` (credentials from `.env`)

Optional (manual DB lifecycle when not relying on boot-time migrations):

```bash
npm --prefix backend run knex:migrate
npm --prefix backend run knex:seed
```

### Automated install

```bash
./install.sh
```

Or (review before running):

```bash
curl -sSL https://raw.githubusercontent.com/eduskillbridge/SkillBridge/main/install.sh | bash
```

The backend can also serve a lightweight install UI at `/install` when enabled via `ENABLE_INSTALL=true` and `INSTALL_API_ENABLED=true`.

## Screenshots

Add screenshots under `docs/assets/screenshots/` and link them here (recommended set):

- Student dashboard (enrollment, progress, certificates)
- Instructor class builder (lessons/resources/assignments)
- Admin operations (tenants, payments, cache flush)
- Community + AI assistance

## Links

- Architecture: `docs/architecture.md`
- API summary: `docs/api.md`
- Installation: `docs/installation.md`
- Deployment: `docs/deployment.md`
- Tenant operations: `docs/tenant-onboarding-guide.md`
- Backend notes: `backend/README.md`
- Docs index: `docs/README.md`
