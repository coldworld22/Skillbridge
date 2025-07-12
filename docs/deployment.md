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

## Next.js image domains

If your uploads are served from the backend domain you should update the
`remotePatterns` in `frontend/next.config.mjs` to include your production domain
so Next.js can display those images. For example add an entry for
`https://yourdomain.com`.

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
backend including the `/api` prefix.

