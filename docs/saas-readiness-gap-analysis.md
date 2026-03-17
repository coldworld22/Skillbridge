# SaaS readiness gap analysis

This checklist is a practical "what is still missing" guide to move SkillBridge from a feature-rich product to a production-grade SaaS business.

## Current baseline (already in place)

SkillBridge already includes several strong SaaS foundations:

- Multi-tenant schema primitives (`tenants`, `tenant_memberships`, `tenant_domains`, `subscriptions`) and tenant scoping in the migration SQL.
- Tenant domain seeding and validation flow in deployment docs (`TENANT_DOMAIN_SEEDS`, `validate:tenant-domains`).
- Plan + feature-gating architecture (`plans`, `plan_features`, `user_subscriptions`, `plan_usage_metrics`).
- Operational docs for deployment, backups/restores, onboarding, and trial/upgrade playbooks.

This means the platform is **SaaS-capable**, but still needs hardening across billing automation, observability, compliance, and enterprise controls to be considered "full SaaS".

## Gap matrix

| Area | Current signal in repo | Missing for full SaaS | Priority |
|---|---|---|---|
| Tenant isolation guarantees | Tenant columns/constraints and scoped uniqueness exist in migrations. | Add DB-level row-level security (RLS), automated tenant-isolation tests, and per-request tenant guardrails to prevent cross-tenant reads/writes by mistake. | P0 |
| Billing lifecycle automation | Subscription and plan models exist. | Add end-to-end billing state machine: webhook idempotency, dunning/retries, proration, cancellation at period end, and invoice reconciliation automation. | P0 |
| Tenant self-serve onboarding | Onboarding playbook exists for operators. | Add self-serve tenant creation + guided setup wizard (domain connect, branding, SMTP, first admin) without manual support dependency. | P0 |
| Observability & SLOs | Health endpoint and log checks are documented. | Add centralized metrics/traces, error budgets, alert routing, synthetic checks, and a public/internal status page workflow. | P0 |
| Backup/DR posture | Backup/restore scripts are documented. | Add scheduled automated backups, regular restore drills, RPO/RTO targets, cross-region/object-storage backups, and auditable recovery reports. | P0 |
| Security/compliance | Core auth/security deps are present (helmet, rate limit, sessions). | Add SOC2/GDPR-ready controls: data retention policy, DPA tooling, right-to-erasure workflows, audit evidence collection, secret rotation cadence, and formal vuln management SLA. | P0 |
| Access & identity (B2B) | Role system exists (student/instructor/admin/super admin). | Add enterprise SSO (SAML/OIDC), SCIM or bulk user provisioning, domain claim/verification UI, and fine-grained RBAC for tenant admins. | P1 |
| Revenue operations | Coupons/trials/plans documented. | Add finance-grade reporting (MRR/ARR/churn/cohorts), tax/VAT handling, failed-payment recovery funnels, and revenue recognition exports. | P1 |
| Product analytics | Analytics service exists in backend. | Add tenant-level product analytics dashboards, funnel tracking, feature-adoption metrics, and experiment flags for pricing/activation optimization. | P1 |
| Customer support at scale | Support playbooks and escalation steps documented. | Add in-app support tooling: tenant context panel, event timeline, impersonation with audit trail, and SLA policy enforcement. | P1 |
| Release safety | Basic release checklist and tests are documented. | Add CI quality gates (lint/test/build), migration safety checks, canary/staged deploy flow, and rollback automation. | P1 |
| Platform extensibility | Third-party integrations are configurable. | Add audited integration lifecycle: API key rotation UX, permission scopes, integration health checks, and tenant-specific webhook management UI. | P2 |

## 30/60/90 day execution plan

### First 30 days (must-have risk reduction)

1. **Define tenant safety contract**
   - Document a single tenant resolution source of truth for HTTP, jobs, and scripts.
   - Add integration tests for "cannot access other tenant's data" on top APIs.
2. **Close billing reliability gaps**
   - Implement webhook idempotency keys and replay-safe handlers.
   - Add subscription lifecycle tests (trial → active → grace → suspended/cancelled).
3. **Stand up observability minimum**
   - Emit structured logs with tenant IDs and request IDs.
   - Add dashboards + paging alerts for API latency, 5xx rate, and queue failures.
4. **Automate backups**
   - Schedule backups daily, verify checksums, and run monthly restore drills.

### Days 31-60 (self-serve + enterprise readiness)

1. Build self-serve tenant onboarding wizard.
2. Add tenant admin RBAC matrix and permission editor.
3. Start SSO (OIDC first, then SAML) and domain claim UX.
4. Implement audit exports and right-to-erasure runbook for compliance.

### Days 61-90 (scale + revenue optimization)

1. Ship SaaS KPI dashboards (MRR, expansion, churn, failed payment funnel).
2. Add canary deployment + automated rollback hooks.
3. Publish internal status/incident playbook and customer-facing incident templates.
4. Add integration health monitoring and webhook retry/dead-letter handling.

## Definition of "full SaaS" for SkillBridge

Use this as the go/no-go checklist:

- [ ] Any tenant can sign up, configure domain/branding, and invite team members without support.
- [ ] Billing updates are fully automated and resilient to retries/failures.
- [ ] No cross-tenant data access is possible by code-path mistakes (tested + enforced).
- [ ] SLOs, alerting, and incident workflows are in place and exercised.
- [ ] Backups/restores are automated and proven on a recurring cadence.
- [ ] Compliance and security operations are documented, measured, and auditable.
- [ ] Enterprise identity (SSO/provisioning) is available for B2B tenants.

When all boxes are checked, SkillBridge is not only multi-tenant technically, but operationally mature as a full SaaS platform.
