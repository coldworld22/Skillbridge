# SkillBridge Documentation

Welcome to the self-hosted SkillBridge documentation bundle. Everything shipped
in the CodeCanyon download lives inside this `docs/` folder and is available
from your running application at `/docs`. Start with the installation guide
below, then explore the remaining walkthroughs to learn how to configure,
customise, and operate the platform.

## Installation quick start

The packaged ZIP already contains the backend, frontend, helper scripts, and
environment templates. Follow the guide to bring the app online without cloning
Git:

- [Installation Guide](./installation.md) — complete walkthrough for setting up
  SkillBridge from the customer ZIP on a local workstation or live host.
- [Deployment Checklist](./deployment.md) — TLS, reverse-proxy, and production
  hardening tips once the installer finishes.
- [License Verification](./license-verification.md) — understand how purchase
  codes are validated in your instance.

## Prerequisites

SkillBridge requires the following tools on the machine where you run the
installer:

- Node.js 18 or later (npm 9+ is bundled)
- Docker Engine with the Docker Compose **V2** plugin (`docker compose` command)
- Redis or another session store for production deployments

Refer to the installation guide for copy-and-paste commands tailored to macOS,
Windows, and Linux.

## Staying up to date

When new versions are published, download the latest ZIP from your customer
portal, back up your `.env` files and uploaded assets, then replace the
application folders with the new package. Rerun `./install.sh` (or the manual
migration commands) to apply database updates—no Git workflow is required.

## Explore more guides

- [Admin onboarding](./admin-ads-management.md) and the other admin guides show
  how to configure catalog content, promotions, and integrations.
- [Workflows](./class-lifecycle-workflow.md) explain key processes such as class
  creation, student enrollment, and payment handling.
- [API docs](./api-docs.md) describe the available REST endpoints if you plan to
  integrate SkillBridge with other services.

Browse the `/docs` section within the hosted app to read every guide in a
responsive, searchable interface.
