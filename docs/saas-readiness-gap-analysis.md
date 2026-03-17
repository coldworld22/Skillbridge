# SaaS readiness gap analysis

This document is a practical audit of SkillBridge's current state and what is still missing to operate confidently as a **full SaaS platform**.

## What is already in place

### 1) Multi-tenant request isolation and membership checks
- Host/header-based tenant resolution is implemented in middleware.
- Tenant membership and role checks are enforced before tenant actions.
- Tenant status (`active`, `grace`, `suspended`, `cancelled`) can block write operations.

### 2) Subscription + billing surface
- Dedicated routes and docs exist for subscriptions, tenant subscriptions, invoices, and payment processors (Stripe/PayPal).
- Plan/feature catalog documentation exists with role-aware plans and entitlement-focused behavior.

### 3) Delivery baseline
- CI pipeline exists for backend and frontend (lint/build/test with coverage artifact upload).
- Deployment and installation docs/scripts are present.

## Critical gaps to close for “full SaaS” maturity

The items below are the highest-leverage missing pieces for production-grade SaaS operations.

### A. Tenant data security hardening (P0)
1. **Database-level tenant isolation strategy should be formalized and verified**
   - Add an explicit standard for tenant scoping in every query path (or move sensitive tables to RLS/DB policies where feasible).
   - Add automated tests proving cross-tenant reads/writes are impossible for each core module.
2. **Session and token hardening checklist**
   - Enforce key rotation policy for JWT/refresh secrets.
   - Add explicit token revocation strategy for compromised sessions.

### B. Revenue operations completeness (P0)
1. **Billing lifecycle automation**
   - Ensure lifecycle webhooks are fully handled (trial ending, payment failed, chargebacks, cancellation at period end, plan downgrade proration rules).
2. **Dunning and retry policy**
   - Implement documented retry schedule + customer communications for failed renewals.
3. **Finance reconciliation**
   - Add scheduled reconciliation report between internal subscription records and payment processor events.

### C. Reliability + operations readiness (P0)
1. **Backup/restore runbook + automated restore tests**
   - Backups must be verifiably restorable, not just scheduled.
2. **SLOs + alert thresholds**
   - Define service-level objectives for API availability, checkout success, and login success.
3. **Incident management process**
   - Add a short documented incident flow (severity levels, owner, comms cadence, postmortem template).

### D. Compliance + trust controls (P1)
1. **Data retention and deletion policy**
   - Define retention windows for logs, user content, and analytics data.
2. **Tenant self-service privacy actions**
   - Add auditable workflows for data export and account/org deletion requests.
3. **Audit trail coverage**
   - Ensure admin and billing-critical actions are immutable and queryable.

### E. Product SaaS essentials (P1)
1. **Self-serve workspace lifecycle**
   - Improve end-to-end tenant onboarding: create workspace, verify domain, configure brand, choose plan, invite team.
2. **Feature-gate observability**
   - Add visibility into entitlement denials and quota exhaustion by tenant/plan to reduce support load.
3. **In-app upgrade/downgrade UX and safeguards**
   - Clear impacts preview (limits/features), effective date, and rollback handling.

## Suggested 30/60/90-day execution plan

### First 30 days
- Create a tenant-isolation test matrix for all critical endpoints.
- Ship billing webhook state machine for failure/cancellation/trial transitions.
- Publish backup restore drill doc and run first restore simulation.

### Day 31–60
- Add dunning automation and finance reconciliation reports.
- Ship audit log expansion for admin/billing/security actions.
- Define and monitor core SLOs with alerting.

### Day 61–90
- Launch tenant self-service data export/deletion workflows.
- Improve self-serve tenant onboarding (domain, invites, branding, plan).
- Add success dashboards: conversion, churn, failed renewals, quota friction.

## Quick scorecard (current estimate)

| Area | Status | Notes |
|---|---|---|
| Multi-tenancy foundation | Strong | Middleware-based tenant resolution and role enforcement are present. |
| Billing capabilities | Medium | Payment and plan surfaces exist; lifecycle automation depth should be expanded. |
| Reliability operations | Medium-Low | CI exists; operational drills/SLO/incident playbooks should be strengthened. |
| Compliance posture | Medium-Low | Needs clearer retention/export/deletion and broader immutable audit coverage. |
| Self-serve SaaS experience | Medium | Core pieces exist, but end-to-end tenant lifecycle can be made more autonomous. |

## Definition of “full SaaS” for SkillBridge

SkillBridge should be considered “full SaaS ready” when:
1. Tenant isolation is proven by automated tests across critical domains.
2. Subscription lifecycle transitions are automated and reconciled with payment providers.
3. Backups, restore drills, SLOs, and incident operations are documented and routinely executed.
4. Privacy/compliance workflows (export/delete/retention) are available and auditable.
5. Tenants can self-serve onboarding, upgrades, team management, and domain setup with minimal support intervention.
