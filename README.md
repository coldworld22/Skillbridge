# SkillBridge

SkillBridge is a full-stack learning platform powered by an Express.js backend and a Next.js frontend. Docker Compose is used to run the API, database and web application locally with minimal configuration.

## Quick start

1. Copy the example environment file and adjust values as needed:

   ```bash
   cp backend/.env.example backend/.env
   # edit backend/.env and set your secrets
   # FRONTEND_URL defaults to http://localhost:3000
   # set it to your frontend's domain if different
   # When using docker-compose make sure the value does
   # not include an extra "FRONTEND_URL=" prefix.
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

4. Visit `http://localhost:3000` to access the frontend when running locally. The API will be available at `http://localhost:5000/api`.

For detailed instructions see [docs/installation.md](docs/installation.md).
See [docs/deployment.md](docs/deployment.md) for tips on configuring environment variables when hosting the app.
New users can follow the [Student Registration Guide](docs/student-registration-guide.md) to learn how to sign up and enroll in classes.
If Google sign-in fails with `redirect_uri_mismatch`, see [docs/social-login-setup.md](docs/social-login-setup.md) for the required OAuth callback URL.

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
- Fields for a class include `title`, `description`, `start_date`, `end_date`, `price`, `max_students`, `language` and a unique `slug` for public URLs.

For an overview of the student purchase and enrollment process see [docs/student-enrollment-workflow.md](docs/student-enrollment-workflow.md).

## Student helper class

The backend contains a small utility class `Student` located at
`backend/src/modules/users/student/student.class.js`. It can be used in tests or
scripts to simulate common student actions such as discovering classes, adding
items to the cart and completing checkout. The `checkout` method now generates a
unique enrollment ID for each class and returns both the created enrollment and
payment record.


For a walkthrough of creating a class, managing assignments, calculating final scores and issuing certificates see [docs/class-lifecycle-workflow.md](docs/class-lifecycle-workflow.md).
