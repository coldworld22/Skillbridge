# Deployment Guide

Follow these steps to run SkillBridge on a server or production host.

## ZIP package deployments

If you received the managed archive from Memonet, follow the
[ZIP installation workflow](./installation.md#deploy-from-the-customer-zip-package)
to upload the bundle, prepare the environment files, and run the install
scripts. That section covers cPanel/FTP uploads, SSH-based installs, and
fallbacks for hosts that cannot run Docker. Use this approach when you do not
have Git access on the production server or when you prefer to promote a tested
bundle directly from the customer portal.

## Automated Nginx and SSL setup

After pointing your domain DNS records to the server, run the installation
wizard to configure Nginx and request Let's Encrypt certificates:

```bash
./install.sh
```

The script prompts for the environment and, in production mode, the domain
name. To run non-interactively you can provide arguments:

```bash
./install.sh production yourdomain.com
```
In either case the script updates the domain placeholders in `nginx/conf.d`
and uses `certbot` (or `acme.sh`) to generate certificates at the paths
referenced in `nginx/conf.d/ssl.conf`.

## Configure environment variables

1. **Nginx** – set the `ALLOWED_ORIGINS` environment variable to a
   comma-separated list of origins that should be allowed by the reverse
   proxy (e.g. `https://foo.com,https://bar.com`). After updating this list
   reload Nginx so the new value takes effect:

   ```bash
   docker compose exec nginx nginx -s reload
   ```

2. **Backend** – copy `backend/.env.example` to `backend/.env` and set:
   - `PORT` – typically `5000` unless changed.
   - `APP_DOMAIN` – your production domain (e.g. `yourdomain.com`).
   - `SUPPORT_EMAIL` – address used for outbound messages.
   - `FRONTEND_URL` – set this to the full URL of your frontend. You can
     specify multiple domains separated by commas. For example:

    ```bash
  # Example using a custom domain and server IP
  APP_DOMAIN=yourdomain.com
  FRONTEND_URL=https://${APP_DOMAIN},http://147.93.121.45
  # Do not prefix with "FRONTEND_URL=" when using
  # Docker Compose environment variables.
    ```

   For production deployments, Docker Compose also loads variables from
   `backend/.env.production`. Copy `backend/.env.production.example` to
   `backend/.env.production` and fill in production secrets such as database
   credentials and JWT keys.

   If the frontend and backend are on different subdomains, also set
    `COOKIE_DOMAIN` so the authentication cookie can be shared. Example:

    ```bash
   COOKIE_DOMAIN=.${APP_DOMAIN}
   ```

   When running over plain HTTP but using different subdomains (e.g. staging
   environments), also add:

   ```bash
   COOKIE_SECURE=false
   COOKIE_SAMESITE=None
   ```

    To enable password recovery via email, provide SMTP settings or
    configure them later through the `/api/email-config` endpoint or the admin
    dashboard at `/dashboard/admin/settings/email-config`. At a minimum
    the backend requires the following variables:

    ```bash
    SMTP_HOST=smtp.mailtrap.io
    SMTP_PORT=587
    SMTP_SECURE=false
    SMTP_USER=your_smtp_username
    SMTP_PASS=your_smtp_password
    ```

    To disable sending emails (OTP codes will be logged instead), set:

    ```bash
    DISABLE_EMAILS=true
    ```

    The default templates include your logo and a footer. OTP codes expire

    after **15 minutes**. You can customize the app name, logo and contact
    email from `/dashboard/admin/settings/app` so outbound emails show your
    branding.

     
    This value is used for CORS and socket.io connections. If it still points to
    `http://localhost:3001` you may see `Network Error` or CORS errors when
    logging in from the deployed site.

3. **Frontend** – for Docker Compose production builds, set variables in
  `frontend/.env.production`:

```bash
APP_DOMAIN=yourdomain.com
NEXT_PUBLIC_API_BASE_URL=https://${APP_DOMAIN}/api
NEXT_PUBLIC_PGADMIN_URL=https://${APP_DOMAIN}/pgadmin
```

> **Tip:** When `APP_DOMAIN` is defined you can alternatively set
> `NEXT_PUBLIC_API_BASE_URL=/api`. During the build the relative value expands
> to `https://${APP_DOMAIN}/api`, letting reverse proxies expose the API at the
> same origin without hard-coding the domain in your environment file.

Commit only placeholder values. Provide real production settings via
environment variables or by mounting a `.env.production` file at deploy time
so secrets stay out of version control. The root `.env` is intended for local
development and defaults `NEXT_PUBLIC_API_BASE_URL` to
`http://localhost:5002/api` for internal container communication. Remove or
override this file in production so the frontend uses your public HTTPS
domain.

 Without these variables the frontend defaults to `/api` which may point to the
 wrong server when deployed.

### Production example: eduskillbridge.net

To deploy the official site, copy `.env.example` to `.env` and
`backend/.env.production.example` to `backend/.env.production`. Fill in the
database credentials, JWT and refresh token secrets, and SMTP settings with
values managed outside of version control. Configure the public URLs:

```bash
APP_DOMAIN=eduskillbridge.net
FRONTEND_URL=https://eduskillbridge.net
NEXT_PUBLIC_API_BASE_URL=https://eduskillbridge.net/api
NEXT_PUBLIC_PGADMIN_URL=https://eduskillbridge.net/pgadmin
NEXT_PUBLIC_SOCKET_URL=wss://eduskillbridge.net
```

Keep these files out of git and store the secrets in your hosting
environment or secrets manager.

After updating these files, rebuild the Docker images or restart the server so
that the environment changes take effect.

## Run database migrations

Before starting the backend server or after pulling updates, apply any pending
database migrations:

```bash
npm --prefix backend run migrate
```

Running migrations separately keeps `startServer()` lightweight and ensures the
database schema matches the application's expectations.

> **Important:** Docker Compose no longer bind-mounts `backend/src/migrations`.
> When a release adds new migration files (for example the critical verification
> migrations `20250930160000` and `20250930160010`), rebuild the backend image so
> the container sees the updated migration directory before running `npm --prefix
> backend run migrate`:
>
> ```bash
> docker compose build backend && docker compose up -d backend
> ```
>
> Otherwise the running container will still contain the previous migration set
> and Knex will report **"The migration directory is corrupt..."** because it
> cannot find the new files.

## Preserve uploaded media

The admin panel lets you upload a logo and favicon under
`/dashboard/admin/settings/app`. These files are stored inside the backend
container under `/app/uploads`. To keep them after a container restart, mount the
`backend/uploads` folder from the host. In `docker-compose.yml` add:

```yaml
  backend:
    volumes:
      - ./backend/uploads:/app/uploads
```

This ensures custom branding files persist across deployments.

## Preserve database and pgAdmin data

PostgreSQL stores its data in the `postgres_data` volume and pgAdmin uses
`pgadmin_data`. In production, avoid running `docker compose down -v` as the
`-v` flag removes these volumes and wipes the database and pgAdmin settings.
Use `docker compose stop` or `docker compose down` without `-v` to retain your
data. Manually deleting the `postgres_data` or `pgadmin_data` volumes will also
erase data. Consider mounting these volumes to external storage or setting up
regular backups to protect critical information.

## Next.js image domains

Uploads served from the backend domain are now automatically whitelisted for
Next.js Image. The hostname and port are derived from
`NEXT_PUBLIC_API_BASE_URL` at build time.  If you need to allow additional
domains you can still extend `remotePatterns` in
`frontend/next.config.mjs`.

## Troubleshooting

### Knex reports "The migration directory is corrupt"

When Compose reuses an older backend image it may not contain the newest
`backend/src/migrations` files.  Knex then aborts with errors like:

```
The migration directory is corrupt, the following files are missing:
20250930160000_alter_verifications_code_to_varchar255.js,
20250930160010_alter_verifications_code_to_text.js
```

To resolve this:

1. Rebuild the backend image so the container bakes in the updated migration
   list (pass `--no-cache` if you want to discard any cached layers):

   ```bash
   docker compose build --no-cache backend && docker compose up -d backend
   ```

2. Confirm the new container can see the migrations:

   ```bash
   docker compose exec backend ls /app/src/migrations
   ```

   The output should include the verification migrations
   `20250930160000_alter_verifications_code_to_varchar255.js` and
   `20250930160010_alter_verifications_code_to_text.js`.

3. Re-run the migration command if it did not execute automatically during the
   container start-up:

   ```bash
   docker compose exec backend npm run migrate
   ```

If the error persists, stop the backend service and remove the old container so
Compose cannot reuse it (`docker compose rm -fs backend`), then repeat the
build/start steps above.  Always rebuild the backend image after adding or
renaming migration files because the directory is no longer bind-mounted into
the container.

### Login page requests `http://localhost:5002`

If you deploy the frontend and see network errors pointing to
`http://localhost:5002/api` it means the build did not have
`NEXT_PUBLIC_API_BASE_URL` set.  Update `frontend/.env.local` with the correct
backend URL and rebuild/restart the frontend container so the new value is
picked up.

### CORS errors when logging in

If the browser console shows messages like `No 'Access-Control-Allow-Origin'` or
`ERR_NETWORK` during login, your backend is rejecting the frontend's origin.
Edit `backend/.env` and ensure the `FRONTEND_URL` variable lists the exact
domain of your deployed site without a trailing slash. Include both the
`www` and non-`www` variants if you use them. For example:

```bash
FRONTEND_URL=https://${APP_DOMAIN},https://www.${APP_DOMAIN}
```

Restart the backend so the updated CORS settings take effect.
If CORS errors occur when requesting a password reset, ensure the FRONTEND_URL contains your frontend's domain. The API only sends CORS headers for domains listed there.
If you use Nginx or another reverse proxy, ensure it does **not** add its own
`Access-Control-Allow-Origin` header. Duplicates will cause browsers to reject
the response even if both values are identical.

### Home page shows "Failed to load tutorials" or "Failed to load categories"

These messages mean the frontend cannot reach the API. Verify that
`NEXT_PUBLIC_API_BASE_URL` in `frontend/.env.local` points to your backend URL
including the `/api` prefix.  Also confirm the backend server is running and
that the `FRONTEND_URL` in `backend/.env` includes your frontend domain.

### Login redirects repeatedly

If you briefly see the home page then get bounced back to the login form with
browser console messages about CORS, your backend is not allowing the
frontend's origin.  Double check that `FRONTEND_URL` in `backend/.env`
matches the deployed domain exactly and restart the backend.  The
`NEXT_PUBLIC_API_BASE_URL` in `frontend/.env.local` must also point to the
backend including the `/api` prefix. When the frontend and API are on
different subdomains, set `COOKIE_DOMAIN` in `backend/.env` to the shared
base domain (e.g. `.${APP_DOMAIN}`) so the authentication cookie is
available to both sites. If the site uses HTTP, also set:

```bash
COOKIE_SECURE=false
COOKIE_SAMESITE=None
```

This ensures the refresh token cookie is sent across subdomains without HTTPS.

### "Failed to load SEO settings" or network errors

If the dashboard displays **"Failed to load SEO settings"** or other
`ERR_NETWORK` messages, the frontend is usually pointed at the wrong API or the
backend is not allowing the frontend's origin.

1. Verify `NEXT_PUBLIC_API_BASE_URL` in your frontend `.env.local` or
   `.env.production` matches your public backend URL with the `/api` suffix. See
   the [production example](#production-example-eduskillbridgenet) above for a
   typical value using `${APP_DOMAIN}`.
2. Ensure `FRONTEND_URL` in `backend/.env` lists the exact origin of your
   frontend, including both `www` and non-`www` domains if applicable. Refer to
   the earlier `FRONTEND_URL` snippet under **Configure environment variables**.
3. Check the backend logs or browser console for CORS messages such as
   `No 'Access-Control-Allow-Origin'` or `Origin ... not allowed by CORS` to
   confirm which domain is being rejected.

Updating these variables and restarting the affected service should resolve most
SEO and networking issues.

