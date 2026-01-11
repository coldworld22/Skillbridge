# Configuration Reference

This guide lists the configuration files and environment variables that keep a
SkillBridge deployment running. Use it as a quick checklist when you spin up a
new environment, rotate secrets, or hand the project to another team.

## Where configuration lives

| Location | Purpose |
| --- | --- |
| `.env` | Shared variables loaded by Docker Compose. Good place for defaults that apply to both the backend and frontend during local development. |
| `backend/.env` | Runtime configuration for the Node.js API (port, domains, auth, SMTP, Redis, third-party keys). Loaded in every environment. |
| `backend/.env.production` | Overrides for production containers. Keep secrets here or supply them through your hosting platform's secret manager. |
| `frontend/.env.local` | Next.js build-time configuration for local development. |
| `frontend/.env.production` | Optional build-time overrides for production builds when you deploy the frontend separately. |
| `nginx/conf.d/*.conf` | Reverse-proxy rules and TLS paths. Update when your domain or certificate locations change. |

Keep these files out of version control whenever they contain secrets. Store
rotations in your password manager or hosting provider's secret vault and
document ownership so the team knows who can update them.

## Core environment variables

### `.env` (project root)

| Variable | Description | Example |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Default API URL used by the frontend when running inside Docker. Override in per-environment files if the frontend lives elsewhere. | `http://backend:5002/api` |
| `NEXT_PUBLIC_SOCKET_URL` | WebSocket endpoint used by the frontend. Set to a `ws://` or `wss://` URL that points to the backend. | `http://backend:5002` |
| `NEXT_PUBLIC_PGADMIN_URL` | Helps the dashboard surface the pgAdmin URL. | `http://localhost:5050` |
| `ALLOWED_ORIGINS` | Passed to Nginx so it can forward CORS headers. Use a comma-separated list without spaces. | `https://example.com,https://admin.example.com` |
| `ENABLE_INSTALL`, `INSTALL_API_ENABLED` | Toggle the web installer (`/install`). Leave `false` once production setup is complete. | `true` during initial setup |

### `backend/.env`

| Variable | Description | Example |
| --- | --- | --- |
| `PORT` | Port the Express server listens on inside the container or VM. | `5002` |
| `APP_DOMAIN` | Primary domain used in generated URLs and cookies. | `example.com` |
| `FRONTEND_URL` | Comma-separated list of origins allowed to hit the API (for CORS and email links). Include every domain you serve. | `https://example.com,https://www.example.com` |
| `SUPPORT_EMAIL` | From-address used for transactional emails. | `support@example.com` |
| `COOKIE_DOMAIN` | Share auth cookies across subdomains. Required when the frontend lives on a different host. | `.example.com` |
| `COOKIE_SECURE`, `COOKIE_SAMESITE` | Harden or relax cookie behaviour. Use `COOKIE_SECURE=true` / `COOKIE_SAMESITE=None` for HTTPS deployments. | `true`, `None` |
| `JWT_SECRET`, `REFRESH_TOKEN_SECRET` | Secrets that sign access and refresh tokens. Rotate if compromised. | random 64-character strings |
| `DATABASE_URL` or `PG*` variables | Connection string (or discrete components) for PostgreSQL. Required before migrations run. | `postgres://user:pass@postgres:5432/skillbridge` |
| `REDIS_URL` | Session store connection string. Needed for production logins. | `redis://redis:6379/0` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE` | Outbound mail settings for password reset, verification, and notifications. | Mailtrap, SES, or another SMTP provider |
| `INSTALL_SETUP_SECRET` | Optional shared secret that the installer requires via the `X-Install-Setup-Secret` header. | random token |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Optional non-interactive credentials consumed by `install.sh`. Leave unset to enter them manually. | `admin@example.com`, `S3curePass!` |
| `TENANT_DOMAIN_SEEDS` | JSON array of tenant domain mappings used by the seed and validation scripts. Each entry should include `domain` plus `tenant_id` or `tenant_slug`. | `[{"domain":"acme.example.com","tenant_slug":"acme","status":"verified"}]` |

### `backend/.env.production`

Mirror sensitive values from `backend/.env`, but inject production-only
overrides:

- Force `NODE_ENV=production`.
- Set `COOKIE_SECURE=true` and `COOKIE_SAMESITE=None` when the site runs over
  HTTPS.
- Point `FRONTEND_URL` and `SUPPORT_EMAIL` at public domains rather than
  localhost.
- Include payment gateway keys, SMS provider credentials, or other third-party
  tokens that only apply in production.

### `frontend/.env.local` (and `.env.production`)

| Variable | Description | Example |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Base URL (with `/api`) used by the client when making requests. Must be absolute in production. | `https://example.com/api` |
| `NEXT_PUBLIC_SOCKET_URL` | WebSocket endpoint for real-time updates. | `wss://example.com` |
| `NEXT_PUBLIC_TRUSTED_ICON_HOSTS` | Comma-separated domains allowed to render payment icons. | `example.com,cdn.example.com` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (or other integrations) | Any `NEXT_PUBLIC_*` variable is exposed to the browser. Use them for publishable keys only. | `pk_live_123` |

### Operational toggles

| Setting | Where | Notes |
| --- | --- | --- |
| `ENABLE_INSTALL`, `INSTALL_API_ENABLED` | `.env`, `backend/.env` | Disable both after the platform is online to prevent re-running the installer. |
| `CRON_ENABLED` | `backend/.env` | Gate scheduled jobs like email digests. Useful on staging environments. |
| `ALLOW_REGISTRATION` | `backend/.env` | Temporarily disable sign-ups during maintenance windows. |
| `LOG_LEVEL` | `backend/.env` | Adjust backend verbosity (`info`, `warn`, `error`, `debug`). |

## Maintenance checklist

1. **Commit templates, not secrets.** Only the `*.example` files belong in git.
   Copy them before running installs and keep the real `.env` files private.
2. **Document rotations.** When you rotate SMTP, JWT, or payment keys, record
   the timestamp and reason in your runbook so the next hand-off is painless.
3. **Test after changes.** Restart containers (`docker compose up -d --build`)
   and run smoke tests (`/api/health`, admin login, email send) after updating
   environment files.
4. **Back up your `.env` files securely.** Store encrypted copies alongside
   infrastructure documentation so they can be restored if the server is lost.
