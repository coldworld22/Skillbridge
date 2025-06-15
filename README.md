# SkillBridge

SkillBridge is a full-stack learning platform powered by an Express.js backend and a Next.js frontend. Docker Compose is used to run the API, database and web application locally with minimal configuration.

## Quick start

1. Copy the example environment file and adjust values as needed:

   ```bash
   cp backend/.env.example backend/.env
   ```

2. Initialize the database (run migrations and seeds):

   ```bash
   npx knex migrate:latest --knexfile backend/knexfile.js
   npx knex seed:run --knexfile backend/knexfile.js
   ```

3. Build and launch the entire stack:

   ```bash
   docker-compose up --build
   ```

4. Visit `http://localhost:3001` to access the frontend. The API is available at `http://localhost:5000`.

For detailed instructions see [docs/installation.md](docs/installation.md).
