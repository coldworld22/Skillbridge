# SkillBridge Documentation

Open `index.html` in this folder for the fully linked HTML landing page. It
provides quick access to every guide plus shortcuts back to the original
Markdown files when you prefer a text-first view.

## Installation

Choose the path that matches your environment:

- [Deploy from the customer ZIP package](./installation.md#deploy-from-the-customer-zip-package)
  – ideal for cPanel/FTP hosts and managed servers where you upload a prepared
  archive from the Memonet portal.
- [Install from Git](./installation.md#1-clone-the-repository) – clone the
  repository, run the install script, and manage updates with Git.

### Prerequisites

SkillBridge requires the following tools on your workstation or server:

- Node.js 18 or later (npm 9+ is bundled)
- Docker Engine and the Docker Compose **V2** plugin (`docker compose` command)
- Git
- Redis or another session store for production deployments

> **Heads up:** The legacy `docker-compose` v1 CLI is incompatible with recent
> Docker Engine releases and often fails with `KeyError: 'ContainerConfig'`
> when rebuilding containers. Install the Docker Compose V2 plugin or downgrade
> Docker Engine below version 27 before continuing. As a short-term workaround,
> run [`scripts/run-compose.sh`](../scripts/run-compose.sh), which exports
> `DOCKER_API_VERSION=1.43` automatically when it has to fall back to the
> legacy binary.

### Install the required tools

Follow the commands for your operating system to install the prerequisites the
installer enforces.

#### Node.js 18+ (includes npm)

- **macOS (Homebrew):**

  ```bash
  brew install node@20
  echo 'export PATH="/opt/homebrew/opt/node@20/bin:$PATH"' >> ~/.zshrc
  ```

- **Ubuntu / Debian:**

  ```bash
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
  ```

- **Windows:** Download the LTS installer from [nodejs.org](https://nodejs.org/),
  run it, then restart your terminal and confirm with `node -v`.

#### Docker Engine and Docker Compose V2

- **macOS / Windows:** Install [Docker Desktop](https://www.docker.com/products/docker-desktop/),
  ensure it is running, and verify with `docker --version` and
  `docker compose version`.

- **Ubuntu / Debian:**

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

  Docker Desktop already bundles Compose V2; Linux users install the plugin
  manually as shown above.

#### Git

- **macOS:** `brew install git`
- **Ubuntu / Debian:** `sudo apt-get install -y git`
- **Windows:** Install [Git for Windows](https://git-scm.com/download/win) and
  select “Git from the command line” during setup.

Open a fresh terminal after installing these tools so PATH changes take effect,
then rerun `./install.sh` or revisit `/install` to confirm the checks pass.

### Install from ZIP release

If you downloaded the packaged CodeCanyon release (published as **memonet**)
rather than cloning Git, follow these steps to get the archive running on a
workstation or live server:

1. **Upload the ZIP.** Copy the release to the host. For remote servers use
   `scp`/`rsync` (e.g. `scp Skillbridge-v1.0.0.zip deploy@example.com:/var/www`).
2. **Extract into `Skillbridge/`.** Unzip the archive, rename the extracted
   folder to `Skillbridge`, and `cd` into it so `install.sh`, `docker-compose.yml`,
   `backend/`, and `frontend/` sit in the project root.
3. **Fix ownership and permissions.** On Linux change ownership to the deploy
   user (`sudo chown -R deploy:deploy Skillbridge`) and ensure helper scripts
   are executable (`chmod +x install.sh scripts/*.sh`). Local macOS/Windows
   users can usually skip the `chown` step.
4. **Copy the `.env` templates.** Duplicate `.env.example` files for the root,
   backend (both `.env` and `.env.production`), and frontend (`frontend/.env.local`).
   Update the values with your domain, database URL, SMTP credentials, and admin
   account details. See [deployment.md](./deployment.md) for production-only
   settings such as TLS certificates and domain variables.
5. **Run the installer.** Execute `./install.sh` from the project root. The
   script asks whether you are installing locally or in production and applies
   migrations/seeds automatically. For unattended production use the CLI form
   (`./install.sh production yourdomain.com`).
6. **Start Docker services.** Launch the stack with `docker compose up --build`
   for local development or `docker compose up -d --build` on a live host. If
   you skip the automated compose step, run the commands manually after the
   installer exits. When you handle migrations yourself, apply them before
   serving traffic:

   ```bash
   docker compose run --rm backend npm run migrate
   docker compose run --rm backend npm run seed
   ```

The dedicated [installation guide](./installation.md#install-from-zip-release)
contains the same workflow with command examples and troubleshooting tips.

### 1. Clone the repository

```bash
git clone <repo-url>
cd Skillbridge
```

### 2. Configure environment variables

#### Automated install script

The root `install.sh` script streamlines both local and production setups. When
you run it the script:

1. Runs `scripts/check_prereqs.sh` to verify Node.js, npm, Docker, Docker Compose
   V2, and Git. Fix the issue, acknowledge the warning at the prompt, or set
   `ALLOW_PREREQ_FAILURES=true` to continue automatically.
2. Copies `.env.example` files to `.env` when the target file is missing (root,
   backend, backend production, and `frontend/.env.local`).
3. Sources the resulting files so migrations, seeds, and helper scripts inherit
   the configuration.
4. Ensures `backend/uploads/app` exists before branding assets are written.

Supply `ADMIN_EMAIL` and `ADMIN_PASSWORD` via environment variables for
non-interactive use. Optional flags include:

- `SEED_DB=true` — run `npm --prefix backend run seed` after migrations.
- `START_DEV_SERVICES=false` — skip the automatic `docker compose up` step in
  development mode.
- `SKIP_BACKEND_NPM_INSTALL=true` — skip the automatic backend dependency
  install step when you manage packages separately.

In production mode, the script ensures Docker services are running before it
executes database migrations. In development mode it starts the compose stack in
detached mode unless you opt out with `START_DEV_SERVICES=false`.

Before running migrations the script installs backend dependencies with
`npm --prefix backend install` so the Node.js helper scripts are available and
creates `backend/uploads/app/` if it is missing.

#### Backend

Copy the example file and adjust values as needed:

```bash
cp backend/.env.example backend/.env
```

For deployments, Docker Compose also reads `backend/.env.production`. Copy
`backend/.env.production.example` to `backend/.env.production` and fill in
production database credentials and JWT secrets.

Set the display name that should appear in installer prompts and outbound
emails so the branding check passes:

```
APP_NAME=SkillBridge
```

If you plan to disable transactional email during setup, set
`DISABLE_EMAILS=true`. Otherwise provide SMTP credentials so the installer can
verify connectivity:

```
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
```

Create the uploads directory that stores logos and favicons and ensure it is
writable by the backend service user:

```bash
mkdir -p backend/uploads/app
```

Edit `backend/.env` and provide your secrets. `FRONTEND_URL` must match the
exact origin (scheme, host, and port) where the frontend will run to avoid CORS
errors. Separate multiple origins with commas, for example:

```bash
FRONTEND_URL=http://localhost:3000,https://example.com
```

Leave `NODE_ENV` unset so cookies work over HTTP locally. If you need
cross-subdomain cookies without HTTPS, also set:

```bash
COOKIE_SECURE=false
COOKIE_SAMESITE=None
```

If additional domains need access to the API, add them to
`EXTRA_CORS_ORIGINS` as a comma-separated list of URLs:

```bash
EXTRA_CORS_ORIGINS=https://admin.example.com,https://docs.example.com
```

Rate limiting defaults to 1,000 requests per IP every 15 minutes. Adjust the
allowance if your deployment expects heavier bursts of traffic:

```
RATE_LIMIT_MAX=2000
RATE_LIMIT_WINDOW_MS=300000 # 5 minutes
```

A Redis instance (or compatible store) is required to persist sessions in
production. Set `REDIS_URL` in `backend/.env` to point to your Redis server
(for example `redis://localhost:6379`).

The book filter's price range uses configurable defaults:

```
BOOK_PRICE_RANGE_DEFAULT=100
BOOK_PRICE_RANGE_MAX=500
```

These values are read in `backend/src/config/books.js` and mirrored on the
frontend via `frontend/src/utils/constants.js`. When running the frontend
outside Docker, add the `NEXT_PUBLIC_` variants to `frontend/.env.local`:

```
NEXT_PUBLIC_BOOK_PRICE_RANGE_DEFAULT=100
NEXT_PUBLIC_BOOK_PRICE_RANGE_MAX=500
```

##### Installation API

The backend exposes protected setup endpoints at `/api/install` for automated
deployments. Enable them by setting `INSTALL_API_ENABLED=true` in
`backend/.env` and restarting the backend. Authenticate every request with an
administrator JWT and provide the configuration payload when invoking
`POST /api/install/run`.

If you configure `INSTALL_SETUP_SECRET`, clients must also send the same value
in the `X-Install-Setup-Secret` header on every installer request. Remove or
disable the API when setup is complete.

##### Initial admin passwords

Set `ADMIN_INITIAL_PASSWORD` and `SUPERADMIN_INITIAL_PASSWORD` before running
seed scripts if you want to control the passwords for the seeded Admin and
SuperAdmin accounts. If you omit `SUPERADMIN_INITIAL_PASSWORD`, the SuperAdmin
seed generates a secure random password the first time it creates the account
and logs it once—capture the output so operators can sign in later.

#### Frontend (optional)

When using Docker Compose the frontend automatically points to the API on port
`5002`. If you start the Next.js app separately, create `frontend/.env.local`
and set:


```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:5002/api
NEXT_PUBLIC_TRUSTED_ICON_HOSTS=yourdomain.com,cdn.yourdomain.com
```

`NEXT_PUBLIC_TRUSTED_ICON_HOSTS` defines a comma-separated list of allowed
hosts for payment method icons. URLs outside this list will fall back to a
default icon.

The root `.env` file defaults `NEXT_PUBLIC_API_BASE_URL` to
`http://localhost:5002/api` so Docker services can reach the backend container
internally during development. For production builds use
`frontend/.env.production` instead and remove or override the root `.env` so the
frontend points to your public domain.

### 3. Install dependencies (optional)

For manual development outside of Docker:

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

### 5. Launch the stack

Start all services with Docker Compose:

```bash
docker compose up --build
```

The containers expose the following URLs:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5002/api`
- PostgreSQL: `localhost:5432`
- pgAdmin: `http://localhost:5050`
- Redis: `localhost:6379`

Once running, open the frontend URL in your browser and create an account or log
in.

#### Web-based installer (optional)

1. In `backend/.env`, set `ENABLE_INSTALL=true` and `INSTALL_API_ENABLED=true`.
2. Configure Nginx to proxy the installer route to the backend:


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

3. Rebuild and start the containers if they are running.
4. Log in with an administrator account.
5. Visit `http://localhost:5002/install` (or your domain's `/install`) and
   verify the page lists the prerequisite checks.
6. Complete the **Configuration** step by supplying database, SMTP, branding,
   and admin credentials.
7. Run the installer. It updates `backend/.env`, uploads the logo, seeds
   branding/email settings, and provisions the administrator account.

### 6. Running tests

The project includes Jest suites for both the API and the frontend.

```bash
cd backend && npm test
cd ../frontend && npm test
```

### 7. Hosting on a server

1. Provision a Linux server and install Docker and Docker Compose V2.
2. Clone the repository on the server and configure environment variables as
   described above.
   - In `backend/.env`, set production values such as `NODE_ENV=production`,
     `FRONTEND_URL=https://<your-domain>`, `COOKIE_SECURE=true`, and
     `COOKIE_SAMESITE=None`.
   - Create `frontend/.env.local` with
     `NEXT_PUBLIC_API_BASE_URL=https://<your-domain>/api`.
3. Adjust Nginx for your domain.
   - Set the `APP_DOMAIN` environment variable so Nginx and the backend use your
     domain.
   - Obtain TLS certificates (for example via Let's Encrypt) and ensure the
     paths in `ssl.conf` match the certificate locations.
4. Run database migrations and seeds before starting the containers:

   ```bash
   docker compose run --rm backend npm run migrate
   docker compose run --rm backend npm run seed
   ```


5. Build and start the containers in detached mode:

   ```bash
   docker compose up -d --build
   ```

6. Verify the deployment by visiting `https://<your-domain>` in a browser. The
   API is available at `https://<your-domain>/api`.

For updates, pull the latest changes and rebuild:

```bash
git pull
docker compose up -d --build
```

### Additional references

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
