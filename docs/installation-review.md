# SkillBridge Installation Review

This document captures the results of reviewing the `install.sh` workflow and its
supporting scripts so you can verify a deployment end‑to‑end and understand the
expected checkpoints along the way.

## Summary of findings

* The installer orchestrates prerequisite validation, environment configuration,
  optional Docker service startup, database migrations, and admin provisioning
  before emitting a success banner (`"SkillBridge installation completed successfully."`).
* Prerequisite verification currently passes for Node.js and npm in this
  environment. Docker/Docker Compose/Git checks are intentionally downgraded to
  warnings when running inside a container and should be confirmed on the target
  host prior to production use.
* The workflow depends on a reachable PostgreSQL database and outbound SMTP
  credentials. Missing values for these variables halt execution with a clear
  error so the operator can supply the correct settings.

## Prerequisite checks

Run the bundled helper to confirm host tooling before launching the installer:

```bash
./scripts/check_prereqs.sh
```

Sample output from this repository clone:

```
{"ok": true,"allPassed": true,"summary": "All critical prerequisites met. Review the warnings before continuing.","requirements": [{"id":"node","label":"Node.js >= 18","status":"pass","passed":true,"message":"Detected v20.19.4"},{"id":"npm","label":"npm","status":"pass","passed":true,"message":"Detected 11.4.2"},{"id":"docker","label":"Docker","status":"warn","passed":false,"message":"Docker check skipped in containerized environment."},{"id":"docker_compose","label":"Docker Compose","status":"warn","passed":false,"message":"Docker Compose check skipped in containerized environment."},{"id":"git","label":"Git","status":"warn","passed":false,"message":"Git check skipped in containerized environment."}]}
```

* ✅ Node.js 18+ and npm are required (the script exits if they are missing).
* ⚠️ Docker and Docker Compose are strongly recommended. When running on a
  production host, ensure the `docker compose` plugin is available; otherwise the
  installer aborts before attempting to build services.
* ⚠️ Git is optional for ZIP-based deployments but should be available when
  installing from source.

## Configuration scaffolding

The installer automatically copies example environment files into place if they
are missing:

* `.env`
* `backend/.env` and `backend/.env.production`
* `frontend/.env.local`

You can safely customize these files before (or after) running the installer.
For non-interactive automation, pre-populate the required variables (see below)
so the script can run without prompts.

## Required environment variables

Before the installer can continue, the following values must be present either
in the environment or the `.env` files. The script exits early if any are
missing to prevent a partially configured system:

* `ADMIN_EMAIL`
* `ADMIN_PASSWORD`
* `DATABASE_URL`, `DATABASE_USER`, `DATABASE_PASSWORD`
* `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
* `DEFAULT_FROM_EMAIL`
* `APP_DISPLAY_NAME`

`install.sh` attempts to derive `DATABASE_URL`, `DATABASE_USER`, and
`DATABASE_PASSWORD` from standard PostgreSQL variables (e.g. `POSTGRES_URL`,
`POSTGRES_USER`) if they exist. Ensure the database is reachable and that the
account has permission to run migrations.

## Interactive prompts and modes

1. **Mode selection** – choose `development` (default) or `production`. In
   production mode, you must supply the deployment domain (via CLI argument or
   prompt).
2. **Admin credentials** – the script prompts for the initial admin email and
   password when not supplied via environment variables.
3. **Optional Docker startup** – in development mode the installer will attempt
   to start services with `docker compose up --build -d` unless
   `START_DEV_SERVICES=false` is exported. In production, deployment is delegated
   to `scripts/deploy_server.sh` after collecting the domain.

## Database and configuration steps

Once prerequisites and inputs are satisfied the installer performs the following
operations in order:

1. `npm install` in the backend directory (unless `SKIP_BACKEND_NPM_INSTALL` is
   set to `true`).
2. Apply configuration via `backend/scripts/apply-install-config.js`, which
   persists SMTP, branding, and other environment values to the database and
   writes assets (e.g. uploaded logos) to `backend/uploads/app/`.
3. Run database migrations through `npm --prefix backend run migrate`.
4. Seed demo data if `SEED_DB=true`.
5. Provision the initial admin user with
   `backend/scripts/create-admin.js`.
6. Optionally apply additional installer configuration when
   `INSTALL_CONFIG_PATH` is provided.

Any failure in the chain is trapped by `install.sh`; the script prints a helpful
message, records the failing command, and exits with a JSON payload on stdout
(the script redirects structured output to file descriptor 3 for tooling
integration).

## Validating success

A successful run ends with the banner **“SkillBridge installation completed
successfully.”** and all services should be online:

* Backend/API responding on the configured port.
* PostgreSQL schema populated (check via `npm --prefix backend run typeorm schema:log`).
* Frontend reachable (if development services were started).
* Admin user able to authenticate with the provided credentials.

If any of these checks fail, re-run the installer after correcting the reported
error. Because the script is idempotent regarding environment scaffolding and
npm installs, subsequent runs are fast once prerequisites are in place.

## Recommended verification checklist

* Confirm Docker Engine ≥ 24 with the Compose plugin on production hosts.
* Verify outbound SMTP connectivity before launching to avoid setup delays.
* Keep backups of `.env` and `backend/uploads/app/` when re-running the installer
  in production.
* After completing production setup, disable any temporary firewall exceptions
  or installer API toggles described in [`docs/installation.md`](./installation.md).

Following the sequence above ensures SkillBridge installs cleanly and makes it
straightforward to diagnose any issues should they arise.
