# Installation

Follow these steps to run SkillBridge on your local machine.

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- [Docker](https://www.docker.com/) and Docker Compose
- Git

## Setup

1. Clone the repository:

   ```bash
   git clone <repo-url>
   cd Skillbridge
   ```

2. Configure environment variables for the backend:

   ```bash
  cp backend/.env.example backend/.env
  # edit backend/.env and set your secrets
  # FRONTEND_URL defaults to http://localhost:3000
  # change it if your frontend uses a different domain
  ```

   The backend determines cookie security based on `NODE_ENV`. When running
   locally leave `NODE_ENV` unset (defaults to `development`) so the refresh
   token cookie is delivered over plain HTTP. Using `NODE_ENV=production` without
   HTTPS will result in `401` errors when refreshing the session.

   If you need `SameSite=None` for cross-subdomain cookies while still using
   plain HTTP (e.g. staging environments), set `COOKIE_SECURE=false` and
   `COOKIE_SAMESITE=None` in `backend/.env`.

3. (Optional) Install dependencies for manual development:

   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   cd ..
   ```

4. Initialize the PostgreSQL database:

   ```bash
   npx knex migrate:latest --knexfile backend/knexfile.js
   npx knex seed:run --knexfile backend/knexfile.js
   ```

5. Start all services using Docker Compose:

   ```bash
   docker-compose up --build
   ```

   - Backend API: `http://localhost:5000/api`
   - Frontend: `http://localhost:3000`
   - PostgreSQL: `localhost:5432`
   - pgAdmin: `http://localhost:5050`

6. Open the frontend URL in your browser and log in or create an account.

## Running tests

To run backend tests:

```bash
cd backend
npm test
```
