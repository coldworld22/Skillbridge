# Installation Guide

This document explains how to set up SkillBridge for local development and for hosting the platform on a production server.

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- [Docker](https://www.docker.com/) and Docker Compose
- Git
- Redis or another session store for production deployments

## 1. Clone the repository

```bash
git clone <repo-url>
cd Skillbridge
```

## 2. Configure environment variables

### Automated install script

The root `install.sh` script streamlines both local and production setups. When
you run it, the script automatically copies `.env.example` files to `.env` if
they are missing, then sources the resulting files so migrations and other
commands inherit the required environment variables. Supply
`ADMIN_EMAIL` and `ADMIN_PASSWORD` via environment variables for
non-interactive use (for example in CI pipelines). Optional flags include:

- `SEED_DB=true` &mdash; run `npm --prefix backend run seed` after migrations.
- `START_DEV_SERVICES=false` &mdash; skip the automatic `docker compose up` step in
  development mode if you prefer to start services yourself.

In production mode, the script ensures Docker services are running before it
executes database migrations. In development mode it starts the compose stack in
detached mode unless you opt out with `START_DEV_SERVICES=false`. Any migration
or seeding errors halt the script before the admin user creation step so you can
address the problem immediately.

### Backend

Copy the example file and adjust values as needed:

```bash
cp backend/.env.example backend/.env
```

For deployments, Docker Compose additionally reads `backend/.env.production`.
Copy `backend/.env.production.example` to `backend/.env.production` and fill in
production database credentials and JWT secrets.

Edit `backend/.env` and provide your secrets. `FRONTEND_URL` must match the
exact origin (scheme, host, and port) where the frontend will run to avoid
CORS errors. Separate multiple origins with commas, for example:

```bash
FRONTEND_URL=http://localhost:3000,https://example.com
```

The variable defaults to `http://localhost:3000`. Leave `NODE_ENV` unset so
cookies work over HTTP. If you need cross-subdomain cookies without HTTPS,
also set:

```bash
COOKIE_SECURE=false
COOKIE_SAMESITE=None
```

If additional domains need access to the API, add them to
`EXTRA_CORS_ORIGINS` as a comma-separated list of URLs:

```bash
EXTRA_CORS_ORIGINS=https://admin.example.com,https://docs.example.com
```

These origins are merged with `FRONTEND_URL` and the default app domain to
configure CORS.

Rate limiting defaults to 1,000 requests per IP every 15 minutes. Adjust the
allowance if your deployment expects heavier bursts of traffic by setting:

```
RATE_LIMIT_MAX=2000
RATE_LIMIT_WINDOW_MS=300000 # 5 minutes
```

Increase or decrease these numbers to match your usage profile. The health
check endpoint (`/api/health`) is excluded so uptime probes continue to work
even when the limit is reached.

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

### Installation API

The backend exposes protected setup endpoints at `/api/install` for automated deployments. They are disabled by default to reduce the attack surface. When you need to run the installer, explicitly enable the endpoints by setting `INSTALL_API_ENABLED=true` in `backend/.env` and restarting the backend service so the change takes effect:

```
# backend/.env
INSTALL_API_ENABLED=true
```

Every request to `/api/install/*` must be authenticated with an administrator token. Log in as an admin (for example via `/api/auth/login`) and reuse the returned JWT as a `Bearer` token when calling the installation routes.

If you configure `INSTALL_SETUP_SECRET` in `backend/.env`, clients must also send the same value in the `X-Install-Setup-Secret` header on **every** installer request. The backend trims the configured secret before comparison, so avoid trailing spaces when setting the environment variable. Requests that omit the header or provide the wrong secret receive a `403` response with an `INSTALL_LOCKED` error code before the installer runs.

After you finish the installation or automation tasks, immediately disable the API again by removing the setting or switching it back to `false` and redeploying/restarting the backend. Leaving the installer enabled in production is not recommended.

### Initial admin passwords

Set `ADMIN_INITIAL_PASSWORD` and `SUPERADMIN_INITIAL_PASSWORD` in
`backend/.env` before running the seed scripts if you want to control the
passwords for the seeded Admin and SuperAdmin accounts. When left unset, the
seed process will generate secure random passwords and print them to the
console.

### Frontend (optional)

When using Docker Compose the frontend automatically points to the API on port
`5002`. If you start the Next.js app separately, create `frontend/.env.local` and
set:

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
frontend points to your public domain (for example,
`https://yourdomain.com/api`).

## 3. Install dependencies (optional)

For manual development outside of Docker:

```bash
cd backend && npm install
cd ../frontend && npm install
cd ..
```

## 4. Prepare the database

Run migrations and seed data:

```bash
cd backend
npm run migrate
npm run seed
cd ..
```

## 5. Launch the stack

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

### Web-based installer (optional)

The backend ships with a small web-based installer. To use it:

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
5. Visit `http://localhost:5002/install` (or your domain's `/install`) and verify the page lists the prerequisite checks.

Whether you run SkillBridge directly from the monorepo or from the packaged
container image, the backend automatically serves the installer assets. During
development it reads from the top-level `install/` directory, and in production
it falls back to `backend/install/` inside the container image when the
repository layout is different.

Common problems:

- **404 Not Found** – the Nginx block is missing or `ENABLE_INSTALL` is false.
- **Installation via API is disabled** – `INSTALL_API_ENABLED` is not set to `true`.
- **Unauthorized** – you must be logged in as an admin before visiting `/install`.

## 6. Running tests

The project includes Jest suites for both the API and the frontend.

### Backend

```bash
cd backend
npm test
```

### Frontend

```bash
cd frontend
npm test
```

## 7. Hosting on a server

To deploy SkillBridge for real users on a remote host:

1. **Provision a server** running Linux and install [Docker](https://docs.docker.com/engine/install/) and [Docker Compose](https://docs.docker.com/compose/install/).
2. **Clone the repository** on the server and configure environment variables as described above.
   - In `backend/.env`, set production values such as `NODE_ENV=production`, `FRONTEND_URL=https://<your-domain>`, `COOKIE_SECURE=true`, and `COOKIE_SAMESITE=None`.
   - Create `frontend/.env.local` with `NEXT_PUBLIC_API_BASE_URL=https://<your-domain>/api`.
3. **Adjust Nginx for your domain.**
   - Set the `APP_DOMAIN` environment variable so Nginx and the backend use your domain.
   - Obtain TLS certificates (e.g. via Let's Encrypt's certbot) and ensure the paths in `ssl.conf` match the certificate locations.
4. **Run database migrations and seeds** before starting the containers:

   ```bash
   docker compose run --rm backend npm run migrate
   docker compose run --rm backend npm run seed
   ```

5. **Build and start the containers** in detached mode:

   ```bash
   docker compose up -d --build
   ```

6. **Verify the deployment** by visiting `https://<your-domain>` in a browser. The API will be available at `https://<your-domain>/api`.

For updates, pull the latest changes and rebuild:

```bash
git pull
docker compose up -d --build
```
