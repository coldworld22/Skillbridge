# Installation Guide

This document explains how to set up SkillBridge for local development and for hosting the platform on a production server.

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- [Docker](https://www.docker.com/) and Docker Compose
- Git

## 1. Clone the repository

```bash
git clone <repo-url>
cd Skillbridge
```

## 2. Configure environment variables

### Backend

Copy the example file and adjust values as needed:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and provide your secrets. `FRONTEND_URL` should match the
domain where the frontend will run (defaults to `http://localhost:3000`). Leave
`NODE_ENV` unset so cookies work over HTTP. If you need cross-subdomain cookies
without HTTPS, also set:

```bash
COOKIE_SECURE=false
COOKIE_SAMESITE=None
```

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
```

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
npx knex migrate:latest --knexfile backend/knexfile.js
npx knex seed:run --knexfile backend/knexfile.js
```

## 5. Launch the stack

Start all services with Docker Compose:

```bash
docker-compose up --build
```

The containers expose the following URLs:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5002/api`
- PostgreSQL: `localhost:5432`
- pgAdmin: `http://localhost:5050`

Once running, open the frontend URL in your browser and create an account or log
in.

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
   - Replace `eduskillbridge.net` in `nginx/conf.d/default.conf` and `nginx/conf.d/ssl.conf` with your domain name.
   - Obtain TLS certificates (e.g. via Let's Encrypt's certbot) and ensure the paths in `ssl.conf` match the certificate locations.
4. **Build and start the containers** in detached mode:

   ```bash
   docker-compose up -d --build
   ```

5. **Run database migrations and seeds** inside the running backend container:

   ```bash
   docker-compose exec backend npx knex migrate:latest
   docker-compose exec backend npx knex seed:run
   ```

6. **Verify the deployment** by visiting `https://<your-domain>` in a browser. The API will be available at `https://<your-domain>/api`.

For updates, pull the latest changes and rebuild:

```bash
git pull
docker-compose up -d --build
```
