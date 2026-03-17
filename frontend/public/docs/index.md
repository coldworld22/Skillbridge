# SkillBridge Documentation Hub

Welcome! This landing page helps you find the right guide whether you are
setting up SkillBridge for the first time, preparing an Envato submission, or
operating an existing deployment. Each section below links to the detailed
Markdown guides that are also bundled in HTML form for convenience.

## Start here

- [Platform overview](./README.md) – learn how the repository is organised and
  where the backend, frontend, and infrastructure pieces live.
- [Installation guide](./installation.md) – complete walkthrough for Docker,
  Git-based installs, and manual ZIP deployments.
- [Getting started checklist](./getting-started.md) – verify the stack, smoke
  test the admin area, and confirm SMTP/logging after installation.
- [Configuration reference](./configuration-reference.md) – catalogue of `.env`
  files, required secrets, and operational toggles.
- [Deployment checklist](./deployment.md) – environment configuration notes and
  launch-day verification steps.

## Operations and maintenance

- [Release checklist](./release-checklist.md) – required before cutting a new
  Envato submission, including regenerating static documentation.
- [Book management workflow](./book-workflow.md) and
  [class lifecycle overview](./class-lifecycle-workflow.md) – ensure admin teams
  understand how to manage content after launch.
- [Alerts, ads, coupons, and messaging](./admin-alerts.md),
  [admin ads management](./admin-ads-management.md), and
  [messages configuration](./messages-config.md) – configure in-app engagement
  tools.
- [Third-party integrations](./admin-third-party-integrations.md) – connect
  social login providers and other external services.

## Student experience

- [Student registration guide](./student-registration-guide.md) – walk students
  through account creation and verification.
- [Enrollment workflow](./student-enrollment-workflow.md) – explain how classes
  are booked and tracked.
- [Subscription styling tips](./subscription-plan-style.md) – customise pricing
  pages to match your brand.

## Reference material

- [API documentation](./api-docs.md) – REST endpoints exposed by the backend.
- [Architecture overview](./architecture.md) – how the services communicate and
  which infrastructure components are required.
- [License verification with CodeCanyon/Envato](./license-verification.md) –
  backend flow for validating purchase codes.
- [Payment icon sources](./payment-icon-sources.md) – attribution for bundled
  assets.
- [SaaS readiness gap analysis](./saas-readiness-gap-analysis.md) – prioritized
  roadmap to close platform gaps before scaling commercially.

Looking for something else? Browse the rest of the `docs/` directory or use the
sidebar navigation in any HTML guide. All Markdown files are converted to HTML
when you run `python scripts/generate_docs_html.py`, so the release bundle
always includes an offline-friendly knowledge base.
