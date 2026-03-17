# SaaS readiness gap analysis

This checklist is a practical "what is still missing" review for turning SkillBridge into a production-grade SaaS platform. It maps what already exists in the repository and what should be added or hardened before a full-scale launch.

## Current strengths (already present)

- **Multi-tenant foundation exists** via database migration support for SaaS tenancy. (`migrations/saas_multitenant.sql`)
- **Tenant operations guidance exists** for onboarding, trials/upgrades, and domain workflows. (`docs/tenant-onboarding-guide.md`)
- **Subscription and plan documentation exists** (plan lifecycle + feature catalog). (`docs/plans-system-overview.md`, `docs/plan-feature-catalog.md`)
- **Multiple payment-path test coverage exists** including Stripe, PayPal, crypto, and installments. (`backend/tests/stripePaymentRoutes.test.js`, `backend/tests/paypalPaymentRoutes.test.js`, `backend/tests/cryptoPaymentRoutes.test.js`, `backend/tests/paymentInstallments.test.js`)
- **Domain + deployment guidance exists** for HTTPS, DNS, and environment configuration. (`docs/deployment.md`, `nginx/conf.d/default.conf`, `nginx/conf.d/ssl.conf`)

## Gaps to close before calling it "full SaaS"

## 1) Tenant isolation hardening

### What to verify/add
- Enforce tenant scoping in **every** list/read/update/delete endpoint.
- Add cross-tenant penetration tests to ensure one tenant can never query another tenant's data.
- Add safety checks for background jobs and queues so workers always run in tenant context.

### Why this matters
Strong isolation is the non-negotiable SaaS guarantee and usually the highest business risk area.

## 2) Billing reliability and finance operations

### What to verify/add
- Add a webhook replay/idempotency strategy for payment providers.
- Add dunning (failed payment retries, grace periods, automated notifications).
- Add accounting exports (monthly MRR, invoices, tax-ready exports).
- Add plan-change proration policy tests (upgrade/downgrade behavior).

### Why this matters
Revenue leakage and billing disputes can block scale even when core product features are complete.

## 3) Observability and SaaS SRE baseline

### What to verify/add
- Centralized structured logs with per-tenant correlation IDs.
- Metrics dashboards (availability, latency, queue lag, billing success rate).
- Error tracking + alert routing (on-call email/Slack/PagerDuty).
- SLO definitions (for API, auth, checkout) and incident runbooks.

### Why this matters
Without observability, production issues become hard to detect and expensive to resolve.

## 4) Security and compliance posture

### What to verify/add
- Secrets management policy (rotation schedule, no plaintext in runtime hosts).
- WAF/rate limiting strategy at Nginx/API edge for abuse control.
- Regular dependency CVE scanning in CI and documented patch cadence.
- Data retention/deletion workflows and audit trail retention policy.

### Why this matters
Enterprise customers and audits typically require clear, documented security controls.

## 5) Self-serve tenant lifecycle

### What to verify/add
- Tenant self-service provisioning (create tenant, choose plan, start trial).
- Automated tenant offboarding (suspend/export/delete with policy controls).
- In-product admin billing pages (payment method, invoices, cancel/reactivate).
- Delegated admin controls (RBAC for organization-level roles).

### Why this matters
Manual operations do not scale and increase support costs as tenant count grows.

## 6) Product analytics and growth operations

### What to verify/add
- Funnel tracking (signup → activation → paid conversion).
- Cohort retention reporting by plan and tenant segment.
- Feature-flag framework for controlled rollouts and A/B tests.
- Churn reason collection + cancellation recovery flows.

### Why this matters
A "full SaaS" platform needs repeatable growth and retention loops, not just feature completeness.

## 7) Customer-facing trust layer

### What to verify/add
- Public status page and incident communication template.
- SLA and support tier definitions (response/resolution targets).
- Backup/restore RPO-RTO commitments with tested drills.
- Legal docs alignment (Terms, Privacy, DPA/subprocessors where relevant).

### Why this matters
Trust and predictable support are often required for mid-market and enterprise adoption.

## Suggested 30/60/90 day execution plan

### First 30 days (critical controls)
- Tenant-isolation test matrix and blocking CI checks.
- Payment webhook idempotency + retry policy.
- Centralized logs + baseline alerting.

### Next 60 days (scale operations)
- Dunning, proration validation, and finance exports.
- SLO dashboards + incident runbooks.
- Self-serve billing management for tenant admins.

### By 90 days (commercial readiness)
- Public status page + SLA documentation.
- Compliance evidence pack (security, retention, access controls).
- Growth analytics dashboards and churn interventions.

## Quick "full SaaS" definition of done

Treat SkillBridge as "full SaaS ready" when all of the following are true:

1. Tenant isolation is continuously tested and enforced.
2. Billing is resilient (idempotent, retriable, auditable).
3. Observability + on-call response is in place with SLOs.
4. Security/compliance controls are documented and operational.
5. Tenant lifecycle is mostly self-serve.
6. Support/trust artifacts (status, SLA, backups) are customer-visible.

