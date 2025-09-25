# SkillBridge Documentation

Welcome to the SkillBridge documentation hub. This page now contains the
complete installation and configuration guide so you can get up and running
without jumping to external sites. Follow the steps below to prepare your
machine, configure the application, and deploy it for production. Additional
topics such as feature workflows and API references remain available at the end
of this page.

## Prerequisites

Install the required tooling before running the SkillBridge installer. Open a
fresh terminal after installing each tool so the new commands are available in
your shell.

### Node.js 18+ (includes npm)

#### macOS (Homebrew)
```bash
brew install node@20
echo 'export PATH="/opt/homebrew/opt/node@20/bin:$PATH"' >> ~/.zshrc
```

#### Ubuntu / Debian
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### Windows
1. Download the LTS installer from https://nodejs.org/.
2. Run the installer and allow it to add Node.js to your PATH.
3. Close and reopen your terminal, then confirm with `node -v`.

### Docker Engine and Docker Compose V2

#### macOS / Windows
1. Install Docker Desktop.
2. Launch Docker Desktop and verify the installation:
   ```bash
   docker --version
   docker compose version
   ```

#### Ubuntu / Debian
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

> **Heads up:** The legacy `docker-compose` v1 CLI does not work with the latest
> Docker Engine releases. Always confirm `docker compose version` succeeds
> before running the installer.

### Git

- **macOS:** `brew install git`
- **Ubuntu / Debian:** `sudo apt-get install -y git`
- **Windows:** Install Git for Windows and choose “Git from the command line”
  during setup.

### Optional Services

- **Redis** for production session storage. When Redis runs outside Docker, note
  the hostname and port so you can populate `REDIS_URL` later.
- **SMTP** credentials for transactional email. If you plan to disable outbound
  email initially, set `DISABLE_EMAILS=true` during configuration.

## Project Setup

### 1. Clone the repository
```bash
git clone <repo-url>
cd Skillbridge
```

### 2. Run the automated installer

Execute the root installer to provision configuration files, perform
prerequisite checks, and launch the Docker services:

```bash
./install.sh
```

The script performs the following tasks:

1. Runs prerequisite checks for Node.js, npm, Docker, Docker Compose V2, and
   Git. You can override failures by setting `ALLOW_PREREQ_FAILURES=true` when
   necessary.
2. Copies `.env.example` files into place for the root folder, backend,
   production backend, and `frontend/.env.local` if any are missing.
3. Sources the environment files so migrations, seeds, and helper scripts read
   the correct configuration.
4. Installs backend dependencies with `npm --prefix backend install` unless you
   export `SKIP_BACKEND_NPM_INSTALL=true`.
5. Creates `backend/uploads/app/` so branding assets can be stored.
6. Starts the Docker Compose stack in detached mode (set
   `START_DEV_SERVICES=false` to skip this step).
7. Runs migrations and optional seeds (`SEED_DB=true`) before creating the first
   administrator account.

You can provide installer inputs ahead of time by exporting variables such as
`ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `SEED_DB=true` when running the script in a
CI/CD pipeline.

### 3. Configure environment variables manually (if needed)

If you prefer manual control over the configuration or need to adjust the files
after the installer runs, review the following key files:

- `backend/.env`
- `backend/.env.production`
- `frontend/.env.local`
- `frontend/.env.production`
- root `.env`

Copy the sample files if they do not exist:

```bash
cp backend/.env.example backend/.env
cp backend/.env.production.example backend/.env.production
cp frontend/.env.local.example frontend/.env.local
cp frontend/.env.production.example frontend/.env.production
```

Populate the most important variables:

| Variable | Description |
| --- | --- |
| `APP_NAME` | Display name used in installer prompts and outbound email. |
| `FRONTEND_URL` | Comma-separated origins that are allowed to call the API. Include the local development URL (`http://localhost:3000`). |
| `EXTRA_CORS_ORIGINS` | Additional origins beyond `FRONTEND_URL` that require API access. |
| `COOKIE_SECURE` / `COOKIE_SAMESITE` | Set to `true` and `None` respectively when running behind HTTPS in production. |
| `NEXT_PUBLIC_API_BASE_URL` | Frontend pointer to the API (defaults to `http://localhost:5002/api`). |
| `NEXT_PUBLIC_TRUSTED_ICON_HOSTS` | Allowed hostnames for payment icons. |
| `ADMIN_INITIAL_PASSWORD` / `SUPERADMIN_INITIAL_PASSWORD` | Optional explicit passwords for seeded admin accounts. |
| `REDIS_URL` | Redis connection string for production session storage. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `DEFAULT_FROM_EMAIL` | Email credentials used by the backend to send notifications. |

The backend `.env` file must contain matching JWT secrets, database connection
strings, and any optional installer protections such as
`INSTALL_SETUP_SECRET`.

### 4. Prepare the database manually

If you skipped the installer’s automatic migrations, run them yourself:

```bash
cd backend
npm run migrate
npm run seed # optional, populate demo data
cd ..
```

### 5. Launch the stack manually

Start every service with Docker Compose:

```bash
docker compose up --build
```

The containers expose the following endpoints:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5002/api`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- pgAdmin: `http://localhost:5050`

Visit the frontend URL in your browser to sign in with the admin credentials you
set during installation.

## Web-Based Installer

SkillBridge also ships with a guided web installer. Enable it only while you are
running initial setup:

1. Set `ENABLE_INSTALL=true` and `INSTALL_API_ENABLED=true` in `backend/.env`.
2. Ensure your reverse proxy forwards `/install/` traffic to the backend:
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
4. Log in as an administrator and visit `/install` to confirm prerequisite
   checks.
5. Provide your PostgreSQL credentials, SMTP settings (or enable
   `DISABLE_EMAILS=true`), display name, admin account details, and logo file or
   URL.
6. Run the installer. It updates `backend/.env`, stores the logo under
   `backend/uploads/app/`, seeds the branding and email settings, then creates
   the admin user.

Disable the installer afterward by reverting `INSTALL_API_ENABLED` to `false`
and redeploying. Optionally configure `INSTALL_SETUP_SECRET` to require a shared
secret for every API request that hits `/api/install/*`.

## Testing

Run the automated tests to confirm the setup is healthy:

```bash
cd backend
npm test
cd ../frontend
npm test
```

## Production Deployment

When you are ready to serve real users:

1. Provision a Linux server with Docker and Docker Compose V2 installed.
2. Clone the repository and copy your environment files (`backend/.env`,
   `backend/.env.production`, `frontend/.env.production`, root `.env`).
3. Update production values:
   - `NODE_ENV=production`
   - `FRONTEND_URL=https://<your-domain>`
   - `NEXT_PUBLIC_API_BASE_URL=https://<your-domain>/api`
   - `COOKIE_SECURE=true`
   - `COOKIE_SAMESITE=None`
   - `APP_DOMAIN=<your-domain>` (used by Nginx and backend helpers)
4. Obtain TLS certificates and confirm the paths referenced in the Nginx
   configuration under `nginx/`.
5. Run database migrations and seeds:
   ```bash
   docker compose run --rm backend npm run migrate
   docker compose run --rm backend npm run seed
   ```
6. Build and start the stack in detached mode:
   ```bash
   docker compose up -d --build
   ```
7. Verify the site at `https://<your-domain>` and confirm the API responds at
   `https://<your-domain>/api`.
8. For updates, pull the latest code and rebuild:
   ```bash
   git pull
   docker compose up -d --build
   ```

## Additional Guides

The sections below dive deeper into specific features and workflows:

- [Architecture Overview](architecture.md)
- [Deployment Checklist](deployment.md)
- [Social Login Setup](social-login-setup.md)
- [Administration Guides](admin-ads-management.md), including alerts, categories,
  coupons, payment icons, and more
- [Workflow Walkthroughs](book-workflow.md) for booking, enrollment, and class
  lifecycle management
- [API Documentation](api-docs.md)
- [Changelog](changelog.md)
- [Release Checklist](release-checklist.md)

You now have everything required to install, configure, test, and deploy
SkillBridge directly from this documentation page.
