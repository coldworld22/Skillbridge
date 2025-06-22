# SkillBridge

SkillBridge is a full-stack learning platform powered by an Express.js backend and a Next.js frontend. Docker Compose is used to run the API, database and web application locally with minimal configuration.

## Quick start

1. Copy the example environment file and adjust values as needed:

   ```bash
   cp backend/.env.example backend/.env
   # edit backend/.env and set your secrets
   # Optionally set FRONTEND_URL to match your frontend port
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

## Booking API

The backend exposes role-based endpoints for managing instructor bookings:

- `POST /api/bookings/student` – create a booking as the logged-in student
- `GET /api/bookings/student` – list bookings for the current student
- `PATCH /api/bookings/student/:id` – update a booking for the current student
- `DELETE /api/bookings/student/:id` – delete one of the student's bookings
- `GET /api/bookings/instructor` – list bookings for the logged-in instructor
- `PATCH /api/bookings/instructor/:id` – update a booking (e.g. approve or decline)

Admin routes remain available under `/api/bookings/admin`.

## Online Classes API

Endpoints for creating and managing live classes are served under `/api/users/classes`:

- `GET /api/users/classes` – list published classes
- `GET /api/users/classes/:id` – view a specific class
- `POST /api/users/classes/admin` – create a class (requires instructor or admin token)
- `PUT /api/users/classes/admin/:id` – update a class
- `DELETE /api/users/classes/admin/:id` – delete a class
