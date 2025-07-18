# Deployment Guide

Follow these steps to run SkillBridge on a server or production host.

## Configure environment variables

1. **Backend** – copy `backend/.env.example` to `backend/.env` and set:
   - `PORT` – typically `5000` unless changed.
   - `FRONTEND_URL` – set this to the full URL of your frontend. You can
     specify multiple domains separated by commas. For example:
     
    ```bash
  # Example using SkillBridge's VPS domain and IP
  FRONTEND_URL=https://eduskillbridge.net,http://147.93.121.45
  # Do not prefix with "FRONTEND_URL=" when using
  # docker-compose environment variables.
    ```

   If the frontend and backend are on different subdomains, also set
    `COOKIE_DOMAIN` so the authentication cookie can be shared. Example:

    ```bash
    COOKIE_DOMAIN=.eduskillbridge.net
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

 2. **Frontend** – create a `.env.local` file inside `frontend` and set
   `NEXT_PUBLIC_API_BASE_URL` to your backend URL including the `/api` prefix.
   For example:
   
   ```bash
   # Point the frontend to your backend including the /api prefix
   NEXT_PUBLIC_API_BASE_URL=https://eduskillbridge.net/api
   ```
   
   Without this variable the frontend defaults to `/api` which may point to the
   wrong server when deployed.

After updating these files, rebuild the Docker images or restart the server so
that the environment changes take effect.

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

## Next.js image domains

If your uploads are served from the backend domain you should update the
`remotePatterns` in `frontend/next.config.mjs` to include your production domain
so Next.js can display those images. For example add an entry for
`https://yourdomain.com`:

```js
// frontend/next.config.mjs
export default {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'yourdomain.com',
        pathname: '/uploads/**',
      },
    ],
  },
};
```

Rebuild the frontend container after editing this file so Next.js picks up the
new domain.

## Troubleshooting

### Login page requests `http://localhost:5000`

If you deploy the frontend and see network errors pointing to
`http://localhost:5000/api` it means the build did not have
`NEXT_PUBLIC_API_BASE_URL` set.  Update `frontend/.env.local` with the correct
backend URL and rebuild/restart the frontend container so the new value is
picked up.

### CORS errors when logging in

If the browser console shows messages like `No 'Access-Control-Allow-Origin'` or
`ERR_NETWORK` during login, your backend is rejecting the frontend's origin.
Edit `backend/.env` and ensure the `FRONTEND_URL` variable lists the exact
domain of your deployed site, for example:

```bash
FRONTEND_URL=https://eduskillbridge.net
```

Restart the backend so the updated CORS settings take effect.
If CORS errors occur when requesting a password reset, ensure the FRONTEND_URL contains your frontend's domain. The API only sends CORS headers for domains listed there.

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
base domain (e.g. `.eduskillbridge.net`) so the authentication cookie is
available to both sites.

