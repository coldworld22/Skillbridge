# SkillBridge Installation Review

## Environment
- Containerized review environment (Docker, Docker Compose, and Git availability checks skipped automatically by the tooling).
- Node.js v20.19.4 with npm v11.4.2 available globally.

## Prerequisite Check
- `./scripts/check_prereqs.sh` confirms Node.js and npm meet the minimum requirements.
- Docker, Docker Compose, and Git checks are skipped because the script detects that it is running inside a container (`SKIP_HOST_PREREQS` auto-enabled). These components must be installed on the host prior to running the installer outside this environment.

## Dependency Installation
- `npm --prefix backend install` completes without installation errors. npm reports four known vulnerabilities (two low, two high). Review `npm audit` output and apply patches (`npm audit fix` or vendor patches) before production deployment.
- `npm --prefix frontend install` completes without installation errors. npm reports one high-severity vulnerability. Run `npm audit` and upgrade or patch the affected package.

## Installer Script Review
- The Bash installer (`install.sh`) automatically copies example environment files, validates required variables, applies configuration via `backend/scripts/apply-install-config.js`, runs migrations, and optionally seeds data and provisions the initial administrator account.
- `START_DEV_SERVICES` defaults to `true` and triggers `docker compose up --build -d`. Set `START_DEV_SERVICES=false` when Docker is managed externally or unavailable during installation.
- The script requires database and SMTP credentials through `DATABASE_URL`, `DATABASE_USER`, `DATABASE_PASSWORD`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `DEFAULT_FROM_EMAIL`, and `APP_DISPLAY_NAME`. Provide these interactively or via environment variables/`.env` before execution to avoid runtime failures.
- When running non-interactively, pre-populate `ADMIN_EMAIL` and `ADMIN_PASSWORD` or the script aborts.
- For production runs, `DOMAIN` must be supplied (interactive prompt or `DOMAIN` env var) so that deployment steps know which host to configure.

## Outstanding Items
- Provision Docker Engine (with Compose V2) and Git on the host before executing the installer in a fresh environment.
- Ensure PostgreSQL and Redis endpoints referenced in the configuration are reachable before running migrations.
- Address reported npm vulnerabilities prior to launch.

## Summary
All scripted installation steps that can run in the current environment execute without errors. Address the noted prerequisites and dependency vulnerabilities before performing a full installation on target infrastructure.
