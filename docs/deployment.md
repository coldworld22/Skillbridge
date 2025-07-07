# Deployment Guide

Follow these steps to run SkillBridge on a server or production host.

## Configure environment variables

1. **Backend** – copy `backend/.env.example` to `backend/.env` and set:
   - `PORT` – typically `5000` unless changed.
   - `FRONTEND_URL` – set this to the full URL of your frontend. You can
     specify multiple domains separated by commas. For example:
     
     ```bash
    FRONTEND_URL=https://yourdomain.com
     ```
     
    This value is used for CORS and socket.io connections. If it still points to
    `http://localhost:3001` you may see `Network Error` or CORS errors when
    logging in from the deployed site.

2. **Frontend** – create a `.env.local` file inside `frontend` and set
   `NEXT_PUBLIC_API_BASE_URL` to your backend URL including the `/api` prefix.
   For example:
   
   ```bash
   NEXT_PUBLIC_API_BASE_URL=https://yourdomain.com/api
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
