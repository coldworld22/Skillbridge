# Installation Guide

This document explains how to set up SkillBridge for local development.

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
