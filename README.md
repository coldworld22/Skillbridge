# SkillBridge

SkillBridge is a full-stack learning platform powered by an Express.js backend and a Next.js frontend. Docker Compose is used to run the API, database and web application locally with minimal configuration.

## Automated Installation

```bash
curl -s https://example.com/install.sh | bash
```

The script checks prerequisites, copies example env files, builds containers and can seed the database for development setups when `SEED_DB=true`.


Alternatively, launch the backend and open [`/install`](http://localhost:5002/install) to use a simple web-based installer that checks prerequisites and runs the setup scripts after entering configuration values.

## Quick start

1. Copy the example environment file and adjust values as needed:

   ```bash
    cp backend/.env.example backend/.env
    # edit backend/.env and set your secrets
    # FRONTEND_URL defaults to http://localhost:3000
    # set it to your frontend's domain if different and omit any trailing slash
    # When using docker-compose make sure the value does
    # not include an extra "FRONTEND_URL=" prefix.
    # Optionally set ADMIN_INITIAL_PASSWORD and SUPERADMIN_INITIAL_PASSWORD
    # to control the seeded admin credentials
    ```

2. Initialize the database (run migrations and seeds):

   ```bash
   npm --prefix backend run migrate
   npm --prefix backend run seed
   ```
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

## Third-party integrations

The admin dashboard page under `Settings → Third Party` lets you configure API keys for several external services such as ChatGPT, DeepSeek or Claude. For ChatGPT you can register multiple models that users may pick from. See [docs/admin-third-party-integrations.md](docs/admin-third-party-integrations.md) for details. Once keys are saved, users can choose a provider on the community Ask page and request AI-generated answers.

## Messaging providers

Configure SMS gateways under **Settings → Messages Config**. Only one gateway can be active and marked as default. Refer to [docs/messages-config.md](docs/messages-config.md) for setup details and how OTP messages are sent through Infobip.
