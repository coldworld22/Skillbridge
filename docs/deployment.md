# Deployment Guide

Follow these steps to run SkillBridge on a server or production host.

## Configure environment variables

1. **Backend** – copy `backend/.env.example` to `backend/.env` and set:
   - `PORT` – typically `5000` unless changed.
   - `FRONTEND_URL` – set this to the full URL of your frontend. For example:
     
     ```bash
     FRONTEND_URL=https://eduskillbridge.net
     ```
     
     This value is used for CORS and socket.io connections. If it still points to
     `http://localhost:3000` you may see `Network Error` or CORS errors when
     logging in from the deployed site.

2. **Frontend** – create a `.env.local` file inside `frontend` and set
   `NEXT_PUBLIC_API_BASE_URL` to your backend URL including the `/api` prefix.
   For example:
   
   ```bash
   NEXT_PUBLIC_API_BASE_URL=https://eduskillbridge.net/api
   ```
   
   Without this variable the frontend defaults to `http://localhost:5000` which
   will fail once the app is deployed.

After updating these files, rebuild the Docker images or restart the server so
that the environment changes take effect.

## Next.js image domains

If your uploads are served from the backend domain you should also update the
`remotePatterns` in `frontend/next.config.mjs` to include your production domain
so that Next.js can display those images.
