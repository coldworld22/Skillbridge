# SkillBridge Documentation

## Setup

### Installation prerequisites

SkillBridge requires recent versions of Node.js, npm, Docker, Docker Compose V2,
Git, and (for production deployments) a Redis-compatible session store.

- **Node.js 18+ (includes npm 9+)**
  - **macOS (Homebrew)**

    ```bash
    brew install node@20
    echo 'export PATH="/opt/homebrew/opt/node@20/bin:$PATH"' >> ~/.zshrc
    ```

  - **Ubuntu / Debian**

    ```bash
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    ```

  - **Windows** – download and run the LTS installer from
    [nodejs.org](https://nodejs.org/) and verify with `node -v`.

- **Docker Engine and Docker Compose V2**
  - **macOS / Windows** – install
    [Docker Desktop](https://www.docker.com/products/docker-desktop/), ensure it
    is running, and confirm with `docker --version` and `docker compose
    version`.
  - **Ubuntu / Debian**

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

- **Git** – install via Homebrew (`brew install git`), `apt`
  (`sudo apt-get install -y git`), or the
  [Git for Windows](https://git-scm.com/download/win) installer.

Open a fresh terminal after installing the tools so PATH updates apply before
continuing.

### 1. Clone the repository

```bash
git clone <repo-url>
cd Skillbridge
```

### 2. Configure environment variables

Run the provided installer for a guided setup or prepare the `.env` files
manually.

- `./install.sh` verifies prerequisites, copies example `.env` files, ensures
  branding assets can be written to `backend/uploads/app`, and optionally runs
  migrations, seeds, and `docker compose up` for development. Override behavior
  with environment variables such as:
  - `SEED_DB=true` – run `npm --prefix backend run seed` after migrations.
  - `START_DEV_SERVICES=false` – skip automatically starting Docker services.
  - `SKIP_BACKEND_NPM_INSTALL=true` – reuse existing backend dependencies.
- Manual configuration:
  - Copy `backend/.env.example` to `backend/.env` and provide database, JWT,
    SMTP, and branding values. Set `APP_NAME` to the display name you expect in
    installer prompts and outbound email. Define `REDIS_URL` for production
    deployments and adjust rate-limiting or CORS variables as required.
  - For production, copy `backend/.env.production.example` to
    `backend/.env.production` and update secrets.
  - Create `backend/uploads/app/` so the installer can store logo assets.
  - When running the frontend outside Docker, create `frontend/.env.local` with
    values such as:

    ```bash
    NEXT_PUBLIC_API_BASE_URL=http://localhost:5002/api
    NEXT_PUBLIC_TRUSTED_ICON_HOSTS=yourdomain.com,cdn.yourdomain.com
    ```

  - Set `INSTALL_API_ENABLED=true` in `backend/.env` to allow automated
    installation endpoints, optionally protecting them with
    `INSTALL_SETUP_SECRET`. Disable the API again after setup.

### 3. Install dependencies (optional)

For development outside Docker, install JavaScript dependencies manually:

```bash
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### 4. Prepare the database

Run migrations and seed data:

```bash
cd backend
npm run migrate
npm run seed
cd ..
```

Set `ADMIN_INITIAL_PASSWORD` or `SUPERADMIN_INITIAL_PASSWORD` beforehand if you
want deterministic credentials for the seeded administrator accounts.

### 5. Launch the stack

Start the Docker Compose services (frontend, backend, PostgreSQL, Redis, pgAdmin):

```bash
docker compose up --build
```

Access the app at `http://localhost:3000`, the API at `http://localhost:5002/api`,
PostgreSQL on `localhost:5432`, pgAdmin on `http://localhost:5050`, and Redis on
`localhost:6379`.

### 6. Optional web installer

To use the built-in web installer:

1. Set `ENABLE_INSTALL=true` and `INSTALL_API_ENABLED=true` in `backend/.env`.
2. Proxy `/install/` to the backend with Nginx, for example:

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

3. Restart the containers, sign in as an administrator, and visit
   `/install` to complete the configuration wizard.

### 7. Testing and deployment

Run Jest suites with `npm test` in both `backend/` and `frontend/`. For
production deployments, configure your domain in environment variables, obtain
TLS certificates, run migrations via `docker compose run --rm backend npm run
migrate`, and rebuild the stack with `docker compose up -d --build`. See the
[deployment guide](deployment.md) for infrastructure details.

### Additional setup resources

- [Deployment Guide](deployment.md) — production hosting checklist.
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
