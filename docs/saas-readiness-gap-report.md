# SaaS readiness gap report

This report summarizes what still needs to be tightened before positioning SkillBridge as a "full SaaS" platform.

It is based on the current repository structure, deployment docs, CI workflow, and tenant/billing implementation references.

## Current strengths

SkillBridge already includes several strong SaaS foundations:

- Multi-tenant host/domain resolution and tenant membership checks in backend middleware.
- Tenant onboarding, domain setup, trial/upgrade, and support playbooks in docs.
- Plan features and usage-tracking concepts in the billing model docs.
- CI for backend and frontend lint/build/test on push + PR.
- Backup/restore and tenant-scoped backup guidance.

## Gaps to close for "full SaaS"

Status legend:

- ✅ Present
- 🟡 Partial
- ❌ Missing / not formalized yet

### 1) Tenant isolation & enterprise identity

- 🟡 **Tenant isolation hardening**: tenant middleware exists, but add automated "cross-tenant data leakage" integration tests covering all sensitive modules (payments, classes, support, messaging).
- ❌ **Enterprise SSO (SAML/OIDC workspace login)**: social login exists, but enterprise SSO with enforced org identity and domain claims is not documented as supported.
- ❌ **SCIM provisioning/deprovisioning**: no SCIM endpoints/workflows documented.

### 2) Billing, subscriptions, and finance operations

- 🟡 **Subscription lifecycle automation**: plans, coupons, and invoices exist, but production-grade workflows for dunning/retry strategy, grace period messaging, and account suspension/reactivation should be centralized in a billing runbook.
- ❌ **Proration and mid-cycle plan change policy**: define and implement explicit proration behavior for upgrades/downgrades.
- ❌ **Tax/VAT compliance workflow**: tax calculation and invoice tax metadata requirements should be documented and validated per region.

### 3) Reliability, observability, and SRE posture

- ❌ **Centralized monitoring stack**: define baseline monitoring (APM, metrics, logs, traces) and on-call alert routes; currently docs focus on container logs and health checks.
- ❌ **SLO/SLI definitions**: formal uptime/latency/error-budget targets are not captured.
- 🟡 **Disaster recovery drills**: backup/restore scripts exist, but recurring DR game-day schedule and RTO/RPO targets should be documented and tested.

### 4) Security and compliance operations

- 🟡 **Security operations playbook**: secrets/cookie guidance exists, but add a formal incident response runbook (detection, triage, escalation, customer communication).
- ❌ **Vulnerability management cadence**: establish dependency scanning + patch SLA policy and documented ownership.
- ❌ **Audit trail retention policy**: define immutable admin/security event retention and export capabilities for enterprise audits.
- ❌ **Compliance package readiness**: prepare SOC 2 / ISO control mapping evidence checklist (access reviews, backup proof, change management logs, etc.).

### 5) Platform operations & customer success at scale

- ❌ **Status page + incident communication**: public/private status channel with incident templates and update cadence.
- 🟡 **Support SLAs and escalation matrix**: onboarding/support playbooks exist, but contractual SLA tiers and MTTR targets should be formalized.
- ❌ **Self-serve tenant lifecycle**: add/finish self-serve provisioning/offboarding flows (automated tenant creation, guided setup, data export closure workflow).

## Prioritized 30-60-90 plan

### Next 30 days (P0)

1. Create an **operations baseline** document with:
   - uptime target,
   - alert ownership,
   - incident severity matrix,
   - RTO/RPO targets.
2. Add **cross-tenant isolation integration tests** for highest-risk modules.
3. Publish a **billing lifecycle runbook** (trial expiry, failed payments, dunning, suspension, reactivation).

### Days 31-60 (P1)

1. Implement **monitoring stack MVP** (error aggregation + metrics dashboard + alert rules).
2. Define **security incident response and vuln patch policy**.
3. Standardize **support SLA tiers** and escalation paths.

### Days 61-90 (P2)

1. Scope enterprise roadmap: **SAML SSO + SCIM**.
2. Add **tax/proration policy implementation** and docs.
3. Prepare **compliance evidence checklist** for SOC 2 readiness.

## Definition of "full SaaS" (exit criteria)

Use this as the practical completion gate:

- Multi-tenant isolation verified by automated tests and periodic security review.
- Subscription lifecycle fully automated (including failed-payment handling and proration rules).
- Observability + incident response + DR drills documented and exercised.
- Security/compliance controls have owners, schedules, and evidence artifacts.
- Support/SLA model and customer communication process are standardized.

Once these are complete, SkillBridge can be positioned as a mature SaaS platform rather than only a deployable multi-tenant application.
