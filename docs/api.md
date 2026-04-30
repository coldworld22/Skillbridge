# SkillBridge API (summary)

SkillBridge exposes a REST API under the `/api` prefix (mounted in `backend/src/routes/index.js`). This document is intentionally **high-signal**: it describes conventions, the main route groups, and the endpoints that matter for core workflows (auth → tenant → learning → payments).

## Conventions

- **Base URL**: `/api` (local: `http://localhost:5002/api`)
- **Auth**: `Authorization: Bearer <accessToken>` (some clients also use a `token` cookie)
- **CSRF**: unsafe requests are CSRF-protected (session-backed). Fetch a token via `GET /api/csrf-token` and send it back in a CSRF header on mutating requests.
- **Tenancy**:
  - In production, tenant context is derived from the request host (custom domain or `{slug}.<apex>` subdomain).
  - In non-production, `X-Tenant-Id` is supported to avoid DNS setup.
  - Many endpoints enforce `resolveTenant → ensureTenantMembership → enforceTenantStatus → requireEntitlement`.

## Health & operational

- `GET /api/health` — service healthcheck (used by Docker healthchecks)
- `POST /api/cache/clear` — clear caches (admin tooling)
- `GET /api/system-errors` — recent runtime errors from `backend/logs/error.log` (admin tooling)

## Authentication & identity (`/api/auth`)

Public:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password` (alias: `POST /api/auth/request-reset`)
- `POST /api/auth/verify-otp`
- `POST /api/auth/reset-password`
- `POST /api/auth/send-verification`
- `POST /api/auth/confirm-verification`

Tenant-aware (requires auth):

- `GET /api/auth/memberships` — list memberships for the current user
- `POST /api/auth/switch-tenant` — set active tenant + return updated token
- `POST /api/auth/tenant-invites/*` — accept/manage tenant invites

OAuth:

- `GET /api/auth/google|facebook|github|apple`
- `GET /api/auth/*/callback` (Apple uses `POST /api/auth/apple/callback`)

## Users & role-based dashboards (`/api/users`)

Global/shared:

- `GET /api/users/me/full-profile`
- `PATCH /api/users/profile`
- `/api/users/categories/*` — course category system
- `/api/users/tutorials/*` — tutorial browsing + admin management
- `/api/users/classes/*` — online class catalog and instructor/admin management

Role-based route groups:

- `/api/users/admin/*` — administrative operations (moderation, approvals, reporting)
- `/api/users/instructor/*` — instructor tools (classes, assignments, resources, bookings)
- `/api/users/student/*` — student flows (enrollments, certificates, support)

## Learning & scheduling

- `/api/bookings/*` — booking lifecycle
  - Student: `/api/bookings/student/*`
  - Instructor: `/api/bookings/instructor/*`
  - Admin: `/api/bookings/admin/*`
- `/api/video-calls/*` — video call/session endpoints
- Lessons: `/api/users/classes/lessons/*`
- Certificates:
  - `/api/certificates/admin/*`
  - `/api/certificates/instructor/*`
  - `/api/certificates/*` (public/user tutorial certificates)
  - `/api/certificate-templates/*`

## Commerce & billing

- Plans/subscriptions:
  - `/api/plans/*`
  - `/api/user-subscriptions/*`
  - `/api/tenant-subscriptions/*`
- Cart: `/api/cart/*`
- Coupons: `/api/coupons/*`
- Payment methods: `/api/payment-methods/*` (admin + public)
- Payments:
  - Student: `/api/payments/student/*`
  - Instructor: `/api/payments/instructor/*`
  - Admin: `/api/payments/admin/*`
  - Bank transfers: `/api/payments/bank/*` (+ admin: `/api/admin/payments/bank/*`)
  - Stripe: `POST /api/payments/stripe/create`
  - PayPal: `/api/payments/paypal/*` (create + callback)
  - Crypto: `/api/payments/crypto/*` and `/api/payments/nowpayments/*`
  - Coinbase Commerce: `/api/payments/coinbase/*`
- Invoices:
  - `/api/invoices/admin/*`
  - `/api/invoices/student/*`
  - `/api/invoices/instructor/*`

## Content, community, and messaging

- Community:
  - `/api/community/*` (public)
  - `/api/community/admin/*` (moderation/config)
  - `/api/related-questions/*`
- Notifications: `/api/notifications/*`
- Messages: `/api/messages/*`
- Chat: `/api/chat/*`
- Support: `/api/support/*`, `/api/tickets/*`
- Blog: `/api/blog/*`
- FAQs: `/api/faqs/*`

## AI assistance & integrations

- AI assistance: `/api/ai-assistance/*`
- Third-party configuration: `/api/third-party-config/*`
- Social login configuration: `/api/social-login/config/*`
- Email/SMS/payment config: `/api/email-config/*`, `/api/messages/config/*`, `/api/payments/config/*`
- Analytics/ads: `/api/google-analytics/*`, `/api/google-ads/*`, `/api/adsense/*`

## Source of truth

- Route wiring: `backend/src/routes/index.js`
- Domain routes live under: `backend/src/modules/*` and `backend/src/modules/users/*`
- Entitlements middleware (plan/quotas): `backend/src/services/entitlements.js`
