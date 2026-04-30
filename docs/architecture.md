# SkillBridge Architecture

SkillBridge is a **multi-tenant learning + commerce platform**: a Next.js frontend (`frontend/`) backed by a modular Express API (`backend/`) with PostgreSQL and Redis. This document focuses on *backend engineering decisions* that are typically scrutinized in senior backend interviews: isolation boundaries, auth/RBAC, payment safety, and operational readiness.

## High-level topology

```mermaid
flowchart LR
  browser[Browser] -->|HTTPS| nginx[Nginx (TLS + routing)]
  nginx --> web[Next.js (frontend)]
  nginx --> api[Express API (/api)]
  api --> db[(PostgreSQL)]
  api <--> redis[(Redis: sessions/cache)]
  api <--> sio[Socket.IO (/socket.io)]
  api --> uploads[(Uploads/media)]
  api --> docs[Static docs (/docs)]
```

Notes:

- The API serves `/api` plus static assets (`/uploads`), documentation (`/docs`), and an optional install UI (`/install`) depending on environment flags.
- The local stack is reproducible via `docker-compose.yml` (Postgres 14, Redis 7, pgAdmin, backend, frontend, Nginx).

## Backend organization (how the code scales)

The backend is organized as **domain modules** rather than a single “routes/controllers” folder:

- `backend/src/modules/*` — domain boundaries (payments, classes, users, community, chat, etc.)
  - Typical shape: `routes/*.routes.js` → `controllers/*.controller.js` → `services/*.service.js` (+ validators/utils/models per module)
- `backend/src/routes/index.js` — central route composition and middleware stacking per route group
- `backend/src/middleware/*` — cross-cutting concerns (auth, tenancy, CSRF, storage, error handling)
- `backend/src/services/*` — shared services with non-trivial business logic (entitlements/quotas, email/SMS, etc.)
- `backend/src/jobs/*` — background jobs (reminders, cleanup, subscription follow-ups)
- `backend/src/sockets/*` — Socket.IO initialization + connection state

This structure keeps “feature growth” from turning into “god controllers” by forcing boundaries: shared code lives in `services/` or per-module services, and domain routes remain thin.

## Request pipeline (security first)

`backend/src/server.js` intentionally front-loads security and correctness:

1. **Process-level env validation** (required secrets + DB URL). The server fails fast if critical config is missing.
2. **Helmet + CORS allowlist** early so even 4xx responses include CORS headers.
3. **Production host/origin validation** to reduce phishing-proxy risk and ensure tenant routing is trustworthy.
4. **Sessions + CSRF** (`express-session` + `csurf`) with Redis-backed persistence (required in production).
5. **Passport** initialization for OAuth flows.
6. **Rate limiting** with a key strategy that uses `userId:ip` when authenticated (more stable than IP-only).
7. **Static upload serving** with targeted protections (e.g., blocking direct access to paid PDFs).
8. **Route handling** (`app.use(routes)`) + centralized error handler.

This is the “boring but important” production posture that avoids accidental exposure once the app sits behind a real domain and payment providers are active.

## Authentication & RBAC (JWT + permissions)

SkillBridge uses JWTs for API authentication and layered authorization:

- `backend/src/middleware/auth/authMiddleware.js`
  - Accepts access tokens via `Authorization: Bearer <token>` **or** a `token` cookie
  - Loads the user from the database after JWT verification (prevents stale tokens referencing deleted users)
  - Enforces account status + an onboarding gate (some endpoints remain accessible until profile verification completes)
- Token revocation uses a **blacklist table** (`backend/src/services/tokenBlacklistService.js`), enabling server-side invalidation (logout, incident response).
- Authorization is **role + permission** aware:
  - Role helpers: `isAdmin`, `isInstructor`, `isStudent`, `isInstructorOrAdmin`
  - Fine-grained checks: `hasPermission(...)` with a superadmin bypass

Why this design:

- JWTs keep request auth cheap and horizontally scalable.
- Permission codes support incremental rollout of admin capabilities without exploding “role permutations”.

## Multi-tenancy (host-driven + enforced in middleware)

Multi-tenancy is not a frontend concern — it’s enforced server-side via `backend/src/middleware/tenant.js`:

- Tenant resolution:
  1. Verified custom domains (`tenant_domains` table)
  2. Platform subdomains (`{slug}.<apex>` → `tenants.slug`)
  3. Apex domain is treated as *non-tenant* (marketing/login flows)
- `X-Tenant-Id` is allowed outside production to simplify local testing without DNS setup.
- Tenant-aware guards:
  - `ensureTenantMembership()` — denies access when the user is not an active member of the tenant
  - `enforceTenantStatus()` — blocks mutating requests for suspended/cancelled tenants (billing/read paths can be allowed)

This approach prevents “tenant spoofing” and makes it possible to reason about isolation in a single place.

## Plans, quotas, and entitlements (server-side enforcement)

SkillBridge includes a server-enforced entitlements layer (`backend/src/services/entitlements.js`):

- Actions (e.g., `class.create`, `user.invite`) map to:
  - allowed tenant roles
  - optional **plan feature keys** (booleans or numeric limits)
  - optional **quota checks** (count rows in specific tables)
- Plan limits come from `plans.features` (JSONB) with optional overrides (`feature_overrides`).

Why this matters:

- Feature enforcement is centralized and auditable.
- Quotas are enforced where they must be: **at the API boundary**, not in the UI.

## Data layer (Postgres + Knex)

- PostgreSQL access uses Knex with pooling and **connection retry/backoff** (`backend/src/config/database.js`).
- Migrations live under `backend/src/migrations` and are executed at boot in `backend/src/server.js`.

Tradeoff: boot-time migrations reduce “it works locally” friction, but for larger prod deployments you typically move migrations into an explicit deploy step (CI/CD job) to control blast radius and rollout timing.

## Payments (real money constraints)

Payments are designed as a first-class domain with multiple gateways:

- Route groups: `/api/payments/*` (Stripe, PayPal, crypto, bank transfers, admin payment management)
- Core creation flow lives in `backend/src/modules/payments/payments.controller.js`:
  - validates method/amount/currency and records the payment
  - handles installment schedules, coupons, invoices, notifications, and post-payment access grants (enrollment/library)

Where senior-level hardening usually goes next:

- **Idempotency** on payment creation endpoints (avoid double-charging on retries)
- **Transactional boundaries** around “payment recorded → access granted”
- Webhook signature validation + replay protection (for gateways that call back asynchronously)

## Realtime + background jobs

- Realtime uses Socket.IO (`backend/src/sockets/*`) for chat/messages/notifications and interactive experiences.
- Background jobs (`backend/src/jobs/*`) handle reminders (classes/lessons/subscriptions), cleanup, and periodic operational tasks.

## Scaling strategy (what breaks first)

SkillBridge is structured for horizontal scaling with known constraints:

- **Stateless API instances**: authentication via JWT; session state stored in Redis.
- **WebSockets**: if running multiple API instances, use sticky sessions *or* a Socket.IO adapter backed by Redis to keep rooms and presence consistent.
- **Database**: add/verify indexes on hot paths (tenant-scoped lookups, payments, memberships), keep critical flows transactional, and tune pool sizes for concurrency.
- **Uploads**: local disk works for dev; production should use object storage (S3-compatible) + signed URLs for large media.

## Suggested diagrams to add next

- A sequence diagram for `POST /api/payments/*` showing validation → payment record → access grant → invoice/notifications.
- A tenant request flow diagram showing host → tenant resolution → membership check → entitlement check.
