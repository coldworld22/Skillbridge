# SkillBridge Frontend

The SkillBridge frontend delivers the user experience for browsing courses, booking classes, and managing the administrative dashboard. Built with Next.js and Tailwind CSS, the application uses the pages router and organizes code under `src/` into directories for reusable `components`, route `pages`, API `services`, global state `store`, and shared utilities.

## Setup

From the `frontend` directory install dependencies:

```bash
npm install
```

### Browser Support

- The admin analytics dashboard relies on `ResizeObserver` for responsive charts. We bootstrap a shared
  [`resize-observer-polyfill`](https://github.com/que-etc/resize-observer-polyfill) in `_app.js` so older
  browsers without a native implementation can still render the charts.

## Environment Variables

The production build reads configuration from `.env.production`. Define the following keys before building:

- `APP_DOMAIN` – domain where the app is hosted (e.g. `eduskillbridge.net`).
- `NEXT_PUBLIC_API_BASE_URL` – base URL for backend API requests. Production builds must point to an HTTPS endpoint.
- `NEXT_PUBLIC_PGADMIN_URL` – pgAdmin interface endpoint.
- `NEXT_PUBLIC_SOCKET_URL` – WebSocket endpoint, typically `wss://${APP_DOMAIN}`.

Environment files support variable expansion using [`dotenv-expand`](https://github.com/motdotla/dotenv-expand). Values such as `NEXT_PUBLIC_API_BASE_URL=https://${APP_DOMAIN}/api` will resolve `APP_DOMAIN` during `npm run build`.

Only commit placeholder values. Supply real values in production via environment variables or a mounted `.env.production` so `npm run build` can generate a bundle that connects to the correct services. If `APP_DOMAIN` is defined you may set `NEXT_PUBLIC_API_BASE_URL=/api`; the build expands the relative path to `https://${APP_DOMAIN}/api` while still rejecting non-HTTPS public hosts.

For local development copy `.env.local.example` to `.env.local` and ensure `NEXT_PUBLIC_API_BASE_URL` points to your backend (the template defaults to `http://localhost:5002/api`). Without this the browser falls back to `/api`, causing admin pages to send requests to the Next.js dev server instead of the actual API.

Docker builds export `STRICT_PUBLIC_API=true`, so container images **must** provide `NEXT_PUBLIC_API_BASE_URL` either by passing `--build-arg NEXT_PUBLIC_API_BASE_URL=https://your-domain/api` (or `/api` alongside `--build-arg APP_DOMAIN=your-domain`) or by including it in `.env.production`. Builds fail if the value is missing or if a non-local host still uses `http://`.

## Development Server

```bash
npm run dev
```

## Linting

```bash
npm run lint
```

## Testing

```bash
npm test
```

## Production Build

```bash
npm run build
npm start
```

## Admin alerts page

Visit `/admin/alerts` while logged in as an admin to monitor recent warnings and errors reported by the backend.

### Bank transfer receipts

The invoice page allows students selecting bank transfer to upload payment proof. Files are sent to the backend `POST /api/payments/student/receipts` endpoint.

### HTML Sanitization

User-provided HTML such as class descriptions is sanitized with [DOMPurify](https://github.com/cure53/DOMPurify) before rendering. This prevents cross-site scripting by stripping all markup and dangerous attributes.

## Resources

- [Next.js Documentation](https://nextjs.org/docs) – learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) – an interactive Next.js tutorial.
- [Next.js GitHub repository](https://github.com/vercel/next.js).
- [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying).
- [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) – easiest way to deploy a Next.js app.
