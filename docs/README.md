# SkillBridge Documentation

## Setup

### Installation

This quick-start checklist consolidates the full installation steps directly on
the documentation index so you do not need to open a separate guide.

#### 1. Prerequisites

- Node.js 18 or later (npm 9+ is bundled with recent Node.js releases)
- Docker Engine and the Docker Compose **V2** plugin (`docker compose` command)
- Git
- Redis (or another compatible store) for production session persistence

Make sure you are using Docker Compose V2. The legacy v1 CLI frequently fails
with recent Docker Engine versions and the installer will refuse to run when it
detects only the v1 binary.

#### 2. Install required tools

Install the tooling that the automated installer checks for on your operating
system:

- **Node.js 18+**
  - macOS (Homebrew):
    ```bash
    brew install node@20
    echo 'export PATH="/opt/homebrew/opt/node@20/bin:$PATH"' >> ~/.zshrc
    ```
  - Ubuntu / Debian:
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    ```
  - Windows: download and run the LTS installer from [nodejs.org](https://nodejs.org/),
    then restart your terminal and confirm with `node -v`.

- **Docker Engine and Docker Compose V2**
  - macOS / Windows: install [Docker Desktop](https://www.docker.com/products/docker-desktop/),
    ensure it is running, and verify with `docker --version` and
    `docker compose version`.
  - Ubuntu / Debian:
    ```bash
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
    newgrp docker
    sudo mkdir -p /usr/lib/docker/cli-plugins
    sudo curl -SL "https://github.com/docker/compose/releases/download/v2.24.7/docker-compose-linux-$(uname -m)" \
      -o /usr/lib/docker/cli-plugins/docker-compose
    sudo chmod +x /usr/lib/docker/cli-plugins/docker-compose
    docker --version
    docker compose version
    ```

- **Git**
  - macOS: `brew install git`
  - Ubuntu / Debian: `sudo apt-get install -y git`
  - Windows: install [Git for Windows](https://git-scm.com/download/win) and select
    “Git from the command line” during setup.

Open a fresh terminal after installing these tools so PATH changes take effect
before re-running `./install.sh` or visiting `/install` to confirm the
prerequisite checks.

#### 3. Clone the repository

```bash
git clone <repo-url>
cd Skillbridge
```

#### 4. Configure environment variables

The root `install.sh` script automates both local and production setups by:

1. Verifying host prerequisites with `scripts/check_prereqs.sh`.
2. Copying `.env.example` files (root, backend, backend production, and
   `frontend/.env.local`) when targets are missing.
3. Sourcing those files so migrations, seeds, and helper scripts inherit the
   configuration.
4. Ensuring `backend/uploads/app` exists before branding assets are written.

Useful flags when running the script:

- `SEED_DB=true` — run `npm --prefix backend run seed` after migrations.
- `START_DEV_SERVICES=false` — skip `docker compose up` in development mode.
- `SKIP_BACKEND_NPM_INSTALL=true` — reuse existing backend dependencies.

For backend configuration, copy `backend/.env.example` to `backend/.env` and
populate the required values. When deploying, also copy
`backend/.env.production.example` to `backend/.env.production` and provide
production credentials (database URL, JWT secrets, etc.). Set a display name so
emails and installer prompts use the desired branding (`APP_NAME=SkillBridge`).

If you plan to disable transactional email during setup, set
`DISABLE_EMAILS=true`. Otherwise, configure SMTP credentials so the installer
can verify connectivity. Ensure `backend/uploads/app` exists and is writable.

Key backend settings to review:

- `FRONTEND_URL` — list the exact origins where the frontend runs.
- `COOKIE_SECURE`/`COOKIE_SAMESITE` — adjust when running without HTTPS.
- `EXTRA_CORS_ORIGINS` — comma-separated list of additional API consumers.
- Rate limiting defaults (`RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MS`).
- `REDIS_URL` — required for production session persistence.
- `BOOK_PRICE_RANGE_*` — mirrors frontend constants; add `NEXT_PUBLIC_` values
  to `frontend/.env.local` when running the UI outside Docker.
- `INSTALL_API_ENABLED` — toggle protected setup endpoints for automation.
- Optional `INSTALL_SETUP_SECRET` — require a shared secret header for
  installation API calls.
- `ADMIN_INITIAL_PASSWORD` and `SUPERADMIN_INITIAL_PASSWORD` — customize seeded
  admin credentials.

For the frontend, create `frontend/.env.local` when running outside Docker and
set:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:5002/api
NEXT_PUBLIC_TRUSTED_ICON_HOSTS=yourdomain.com,cdn.yourdomain.com
```

#### 5. Install dependencies (optional)

When developing outside Docker:

```bash
cd backend && npm install
cd ../frontend && npm install
cd ..
```

#### 6. Prepare the database

```bash
cd backend
npm run migrate
npm run seed
cd ..
```

#### 7. Launch the stack

Start all services with Docker Compose:

```bash
docker compose up --build
```

The containers expose:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5002/api`
- PostgreSQL: `localhost:5432`
- pgAdmin: `http://localhost:5050`
- Redis: `localhost:6379`

Visit the frontend URL, create an account, and log in.

##### Web-based installer (optional)

To use the web installer:

1. Set `ENABLE_INSTALL=true` and `INSTALL_API_ENABLED=true` in `backend/.env`.
2. Proxy `/install/` traffic to the backend in Nginx:
   ```nginx
   location ^~ /install/ {
     proxy_pass http://backend:5002;
     proxy_http_version 1.1;
     proxy_set_header Host $host;
     proxy_set_header X-Real-IP $remote_addr;
     proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
     proxy_set_header X-Forwarded-Proto $scheme;
   }
   ```
3. Rebuild/start containers, log in as an administrator, then visit
   `/install`.
4. Provide database, SMTP, branding, license (optional), and admin credentials.
5. Run the installer. It updates `backend/.env`, stores the logo, seeds
   settings, and creates the administrator account.

If you set `INSTALL_SETUP_SECRET`, include the same value in the
`X-Install-Setup-Secret` header on every installer request. Disable the API
again after finishing setup.

#### 8. Running tests

- Backend:
  ```bash
  cd backend
  npm test
  ```
- Frontend:
  ```bash
  cd frontend
  npm test
  ```

#### 9. Hosting on a server

1. Provision a Linux server with Docker and Docker Compose installed.
2. Clone the repository and configure environment variables with production
   values (`NODE_ENV=production`, `FRONTEND_URL=https://<your-domain>`, etc.).
3. Configure Nginx for your domain, set `APP_DOMAIN`, and install TLS
   certificates (for example via Let’s Encrypt).
4. Run migrations and seeds:
   ```bash
   docker compose run --rm backend npm run migrate
   docker compose run --rm backend npm run seed
   ```
5. Build and start the containers:
   ```bash
   docker compose up -d --build
   ```
6. Verify the deployment at `https://<your-domain>` (API lives at
   `https://<your-domain>/api`).
7. For updates:
   ```bash
   git pull
   docker compose up -d --build
   ```

### Additional setup references

- [Deployment Guide](deployment.md) — how to deploy SkillBridge.
- [Architecture Overview](architecture.md) — system components and data flow.
- [Social Login Setup](social-login-setup.md) — configure OAuth providers.

## Administration
- [Alerts Management](admin-alerts.md) — configure system alerts.
- [Ads Management](admin-ads-management.md) — manage platform advertisements.
- [Category Management](admin-category-management.md) — organize course categories.
- [Third-Party Integrations](admin-third-party-integrations.md) — connect external services.
- [License Verification](license-verification.md) — verify instructor credentials.
- [Messages Configuration](messages-config.md) — customize message templates.
- [Coupon Management](coupon-management.md) — define promotional codes.
- [Payment Icon Sources](payment-icon-sources.md) — references for payment icons.
- [Subscription Plan Styles](subscription-plan-style.md) — style subscription options.

## Workflows
- [Book Workflow](book-workflow.md) — process for booking classes.
- [Class Lifecycle Workflow](class-lifecycle-workflow.md) — lifecycle of a class.
- [Class Plan Coverage](class-plan-coverage.md) — overview of plan coverage.
- [Student Registration Guide](student-registration-guide.md) — steps for new student sign-up.
- [Student Enrollment Workflow](student-enrollment-workflow.md) — enroll students into classes.

## Reference
- [API Documentation](api-docs.md) — REST API endpoints.
- [Changelog](changelog.md) — record of notable changes.
- [Release Checklist](release-checklist.md) — tasks before a release.
