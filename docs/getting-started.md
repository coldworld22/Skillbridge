# Getting Started

This checklist helps you confirm that a freshly installed SkillBridge instance
is healthy before you invite instructors and students. It assumes you have
already run the installer (`./install.sh`) or followed the manual setup steps
from the installation guide.

## 1. Confirm prerequisites

1. **Docker & Compose** – run `docker compose version` (or `docker-compose
   version`) and confirm both client and server report compatible versions.
2. **Node.js 18+** – `node -v` should return `18.x` or newer if you plan to run
   any scripts outside Docker.
3. **Database access** – if PostgreSQL or Redis live on managed services, make
   sure firewall rules allow traffic from the application hosts.

> 💡 **Tip:** The installer fails fast when a prerequisite is missing. Rerun
> `./install.sh` after fixing the requirement to confirm every check passes.

## 2. Start the stack

If you are using Docker Compose:

```bash
docker compose up -d --build
```

For manual installs (without Docker):

```bash
npm --prefix backend install
npm --prefix backend run migrate
npm --prefix backend run seed          # optional sample data
npm --prefix backend run start         # or pm2 start backend

npm --prefix frontend install
npm --prefix frontend run build
npm --prefix frontend run start        # or next dev for local debugging
```

Wait until the backend reports `Server listening on PORT 5002` (or your custom
port) before proceeding.

## 3. Create or verify admin access

During installation the script prompts for an initial admin email and password.
If you skipped that step or need a new administrator:

```bash
docker compose exec backend node scripts/create-admin.js \
  --email admin@example.com \
  --password "S3curePass!"
```

Replace the command with your preferred credentials. For manual installs run
the script from the repository root without `docker compose exec`.

## 4. Smoke test the platform

Run these checks to ensure the critical paths work:

- Visit `http://localhost:3000` (or your domain) and confirm the landing page
  renders without console errors.
- Sign in as the admin account and browse to `/dashboard/admin`. Verify that
  navigation, search, and basic analytics load.
- Open the API health check (`http://localhost:5002/api/health`) and confirm it
  returns `{"status":"ok"}`.
- Trigger a password reset email to confirm SMTP credentials are valid.
- Upload a logo at `/dashboard/admin/settings/app` to make sure the backend can
  write to `backend/uploads/app`.

## 5. Next steps

- Review the [configuration reference](./configuration-reference.md) to lock
  down environment variables for production.
- Follow the [deployment guide](./deployment.md) for TLS, CORS, and scaling
  advice.
- Invite another teammate so more than one person can access the admin panel.

Once these checks pass you have a working baseline. Continue with the workflow
guides to configure courses, payments, and marketing content.
