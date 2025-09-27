# Installation Guide

This guide explains how to install the packaged SkillBridge application that you
received from CodeCanyon or the Memonet customer portal. The ZIP archive already
contains the backend, frontend, database migrations, sample assets, and helper
scripts—no Git access is required. Follow the steps below to launch SkillBridge
on a local workstation or a live production host.

## System requirements

Prepare the machine where you will run SkillBridge with the following tools:

- **Node.js 18 or later** (npm 9+ ships with the Node installer)
- **Docker Engine** with the Docker Compose **V2** plugin (`docker compose`)
- **4 GB RAM or more** for a smooth Docker experience (8 GB recommended)
- **Redis** or another compatible session store for production deployments
- **An SMTP account** for transactional emails (configure in `.env`)

> **Tip:** Git is optional. Everything you need to bootstrap the project lives
> in the ZIP package. If you prefer Git for future updates you can adopt it
> later, but it is not required to complete this installation.

## Install the required tools

Follow the commands for your operating system to install the prerequisites. Run
these steps on the host where SkillBridge will execute (your laptop for local
development or the server/VPS that will serve live traffic).

### Node.js 18+ (includes npm)

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

- **Windows:** Download the LTS installer from
  [nodejs.org](https://nodejs.org/), run it, then restart your terminal and
  confirm with `node -v`.

### Docker Engine and Docker Compose V2

- **macOS / Windows:** Install
  [Docker Desktop](https://www.docker.com/products/docker-desktop/), ensure it
  is running, and verify with `docker --version` and
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

### Optional services

SkillBridge uses Redis for session storage and queues. When running locally the
installer spins up Redis automatically via Docker. For production hosts either
keep the bundled Redis container or point `REDIS_URL` to a managed service.

Open a fresh terminal after installing these tools so PATH changes take effect,
then rerun `./install.sh` or visit `/install` in the browser to confirm the
checks pass.

## Install from the ZIP package (local or live server)

The steps below cover both local development machines and live servers. Replace
paths and domain names with values that make sense for your environment.

### 1. Upload and extract the archive

1. Download the latest `skillbridge-<version>.zip` from your CodeCanyon download
   area or the [Memonet customer portal](https://customer.memonet.in/).
2. Copy the ZIP to the machine where you will host the app:
   - **Local workstation:** move the file into the directory where you plan to
     keep the project.
   - **Remote server:** transfer the file with `scp` or `rsync`.

     ```bash
     scp skillbridge-v1.0.0.zip deploy@example.com:/var/www
     ```

3. Extract the archive and switch into the resulting directory:

   ```bash
   unzip skillbridge-v1.0.0.zip
   mv skillbridge-v1.0.0 Skillbridge
   cd Skillbridge
   ```

The project root must contain `install.sh`, `docker-compose.yml`, `backend/`,
`frontend/`, and the remaining helper folders. If the archive extracted into a
nested directory, move the files so they sit directly inside `Skillbridge/`.

### 2. Fix ownership and permissions (Linux servers)

Ensure the deploy user owns the files and that helper scripts are executable:

```bash
sudo chown -R deploy:deploy Skillbridge
chmod +x install.sh scripts/*.sh
```

macOS and Windows users can normally skip the `chown` command because the files
already belong to the current user.

### 3. Copy the environment templates

Duplicate each example environment file so the application can load its
configuration:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp backend/.env.production.example backend/.env.production
cp frontend/.env.local.example frontend/.env.local
cp frontend/.env.production.expanded frontend/.env.production
```

These copies provide sensible defaults. You will customise them in the next
step before launching the stack.

### 4. Configure environment variables

Edit the new `.env` files to match your environment:

- **Local or staging setups** typically point everything to `localhost`. Set
  `NEXT_PUBLIC_API_BASE_URL=http://localhost:5002/api`, keep `COOKIE_SECURE=false`,
  and leave `NODE_ENV` unset so the app runs in development mode.
- **Live production hosts** should use the real domain for `APP_DOMAIN`,
  `FRONTEND_URL`, `NEXT_PUBLIC_API_BASE_URL`, and `NEXT_PUBLIC_SOCKET_URL`. Update
  SMTP credentials, JWT secrets, payment gateway keys, and the initial admin
  account email/password before going live.
- **Branding assets** (logos and favicons) belong in `backend/uploads/app/`.
  Create the directory if it does not exist yet and ensure the runtime user can
  write to it:

  ```bash
  mkdir -p backend/uploads/app
  chmod 775 backend/uploads backend/uploads/app
  ```

Reference [deployment.md](./deployment.md) for TLS configuration, domain-specific
variables, and email guidance.

### 5. Run the guided installer

From the project root execute the install script. It verifies prerequisites,
prepares environment files, runs database migrations/seeds, and creates the
initial admin user.

```bash
./install.sh
```

When prompted, choose whether you are setting up a local/development instance or
installing on a production server. For unattended production deployments you can
pass arguments directly (e.g. `./install.sh production yourdomain.com`).

### 6. Start SkillBridge

Use Docker Compose to launch the services. The command differs slightly between
development and production environments:

- **Local development:**

  ```bash
  docker compose up --build
  ```

  The installer can start this automatically; run the command yourself when you
  prefer manual control.

- **Production host:**

  ```bash
  docker compose up -d --build
  ```

If you skip the automated Compose step in the installer, execute the commands
above after the script finishes. When you manage Docker manually, run migrations
before serving real traffic:

```bash
docker compose run --rm backend npm run migrate
docker compose run --rm backend npm run seed  # optional sample data
```

### 7. Sign in and verify

Once the containers are running, open your browser and visit the frontend URL
(typically `http://localhost:3000` locally or `https://yourdomain.com` in
production). Use the admin credentials you supplied during installation to sign
in. Confirm that core flows—user registration, class creation, and payments—work
as expected before inviting learners.

## Shared hosting or manual deployments without Docker

Some shared hosting providers allow Node.js but block Docker. You can still use
the extracted ZIP by running the services directly:

1. Install Node.js 18+ on the host (via the provider's Node manager, nvm, or the
   OS package manager).
2. From the project root run backend commands:

   ```bash
   npm --prefix backend install
   npm --prefix backend run migrate
   npm --prefix backend run seed   # optional sample data
   npm --prefix backend run start  # or manage with pm2/forever
   ```

3. Build and start the frontend:

   ```bash
   npm --prefix frontend install
   npm --prefix frontend run build
   npm --prefix frontend run start
   ```

4. Configure a process manager (PM2, Supervisor, or your host's "Node.js App"
   feature) to keep the backend and frontend running. If the platform only
   supports scheduled scripts, create cron jobs that restart processes after
   maintenance windows and run migrations regularly (`npm --prefix backend run migrate`).

When Node.js apps are not supported, host the frontend on a platform such as
Vercel or Netlify and connect it to the backend API running on a VPS you control.

## Updating to a newer release

When a new SkillBridge version ships, download the latest ZIP from your account,
back up your existing `.env` files and uploaded assets, and then replace the
application folders with the updated package. Re-run `./install.sh` (or the
manual migration commands) so database changes apply cleanly. This workflow keeps
you up to date without needing Git.

## Next steps

- Review [deployment.md](./deployment.md) for TLS, reverse proxy, and scaling
  guidance.
- Visit [license-verification.md](./license-verification.md) to understand how
  customer licenses are validated.
- Explore the remaining guides in `/docs` to learn how to manage content,
  configure payment providers, and administer your SkillBridge platform.
