# SkillBridge

SkillBridge is a full-stack learning platform powered by an Express.js backend and a Next.js frontend. Docker Compose is used to run the API, database and web application locally with minimal configuration.

## Project Layout

- `backend/` - Express.js API server
- `frontend/` - Next.js web application
- `database/` - database schema and seeds
- `docs/` - documentation
- `scripts/` - helper scripts
- `nginx/` - Nginx configuration for deployment
- `install.sh` - interactive installation script
- `docker-compose.yml` - development stack

## Automated Installation

Ensure `bash`, `curl`, `docker` and `docker compose` are installed on your system.

```bash
curl -sSL https://raw.githubusercontent.com/eduskillbridge/SkillBridge/main/install.sh | bash
```

The script validates prerequisites, copies example env files, builds and starts the Docker containers, and can seed the database for development setups when `SEED_DB=true`. After it completes, the app is available at `http://localhost:3000`.

> **Note:** Always review the script before piping it into `bash` to verify it comes from a trusted source.

Alternatively, launch the backend and open [`/install`](http://localhost:5002/install) to use a simple web-based installer that checks prerequisites and runs the setup scripts after entering configuration values. This route is disabled by default; set `ENABLE_INSTALL=true` in the backend environment to expose it.

## Quick start

Install the project dependencies:

```bash
npm --prefix backend install
npm --prefix frontend install
```

1. Configure environment variables:

   - Copy `.env.example` to `.env` in the project root and fill in your secrets
     for local development. Docker Compose loads sensitive values from here,
     including:

       - `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
      - `PGADMIN_DEFAULT_EMAIL`, `PGADMIN_DEFAULT_PASSWORD`
      - `JWT_SECRET`, `REFRESH_TOKEN_SECRET`
      - `FRONTEND_URL`
      - `REDIS_URL`

    A Redis instance (or compatible session store) is required in production
    to persist user sessions. Set `REDIS_URL` to your store's connection
    string.

    The frontend now reads its production settings from
     `frontend/.env.production`. When deploying, remove or override the root
     `.env` and set `NEXT_PUBLIC_API_BASE_URL` in
     `frontend/.env.production` so the build uses your public HTTPS domain (for
     example `https://yourdomain.com/api`) instead of the internal
     `http://backend:5002/api` value used for development.

   - Copy the backend example file and adjust values as needed:

     ```bash
     cp backend/.env.example backend/.env
     # edit backend/.env and set your secrets
     # FRONTEND_URL defaults to http://localhost:3000
     # REDIS_URL should point to your Redis instance for session persistence
     # set it to your frontend's domain if different and omit any trailing slash
     # When using docker-compose make sure the value does
     # not include an extra "FRONTEND_URL=" prefix.
     # Optionally set ADMIN_INITIAL_PASSWORD and SUPERADMIN_INITIAL_PASSWORD
     # to control the seeded admin credentials
     ```

2. Initialize the database:

   1. Apply the Knex migrations to create tables:

      ```bash
      npm --prefix backend run knex:migrate
      ```

   2. Seed development data:

      ```bash
      npm --prefix backend run knex:seed
      ```

      Migration files live in `backend/src/migrations` and seed scripts in
      `backend/src/seeds`. A raw SQL snapshot of the schema is also available
      at `database/schema.sql` for reference.

   Seeding is meant for development environments only and should not be executed in production.

   If `ADMIN_INITIAL_PASSWORD` or `SUPERADMIN_INITIAL_PASSWORD` are not set in
   `backend/.env`, the seed scripts will generate secure random passwords and
   print them to the console.

3. Build and launch the entire stack:

   ```bash
   docker-compose up --build
   ```

4. Visit `http://localhost:3000` to access the frontend when running locally. The API will be available at `http://localhost:5000/api`.

For detailed instructions see [docs/installation.md](docs/installation.md).
See [docs/deployment.md](docs/deployment.md) for tips on configuring environment variables when hosting the app.
For automated production setup run the installation wizard from the project root:

```bash
./install.sh
```

The script prompts for the environment and, in production mode, your domain name before configuring Nginx and requesting Let's Encrypt certificates. To supply values non-interactively use `./install.sh production yourdomain.com`.

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

## Media streaming

Large videos under `/uploads` can be streamed efficiently using `GET /api/media/:filename`.
This endpoint supports HTTP range requests so media plays smoothly even for big files.

## Student helper class

The backend contains a small utility class `Student` located at
`backend/src/modules/users/student/student.class.js`. It can be used in tests or
scripts to simulate common student actions such as discovering classes, adding
items to the cart and completing checkout. The `checkout` method now generates a
unique enrollment ID for each class and returns both the created enrollment and
payment record.


For a walkthrough of creating a class, managing assignments, calculating final scores and issuing certificates see [docs/class-lifecycle-workflow.md](docs/class-lifecycle-workflow.md).

## Admin alerts

Administrators can monitor runtime warnings and errors from the dashboard. The alerts page fetches the last entries in `logs/error.log` via `/api/system-errors` and displays them with pagination. See [docs/admin-alerts.md](docs/admin-alerts.md) for details.

## Admin category management

Admins can build a nested list of course categories. CRUD endpoints live under `/api/users/admin/categories`. See [docs/admin-category-management.md](docs/admin-category-management.md) for an overview of the routes and frontend pages.

## Cache management

Admins can flush cached data from the dashboard. The **Clear Cache** button in the admin sidebar triggers `POST /api/cache/clear`, which purges Redis and other configured caches. Use this after deployments or major configuration changes to ensure fresh data.

## Third-party integrations

The admin dashboard page under `Settings → Third Party` lets you configure API keys for several external services such as ChatGPT, DeepSeek or Claude. For ChatGPT you can register multiple models that users may pick from. See [docs/admin-third-party-integrations.md](docs/admin-third-party-integrations.md) for details. Once keys are saved, users can choose a provider on the community Ask page and request AI-generated answers.

## Messaging providers

Configure SMS gateways under **Settings → Messages Config**. Only one gateway can be active and marked as default. Refer to [docs/messages-config.md](docs/messages-config.md) for setup details and how OTP messages are sent through Infobip.
