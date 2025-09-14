# SkillBridge Frontend

The SkillBridge frontend delivers the user experience for browsing courses, booking classes, and managing the administrative dashboard. Built with Next.js and Tailwind CSS, the application uses the pages router and organizes code under `src/` into directories for reusable `components`, route `pages`, API `services`, global state `store`, and shared utilities.

## Setup

From the `frontend` directory install dependencies:

```bash
npm install
```

## Environment Variables

The production build reads configuration from `.env.production`. Define the following keys before building:

- `APP_DOMAIN` – domain where the app is hosted (e.g. `eduskillbridge.net`).
- `NEXT_PUBLIC_API_BASE_URL` – base URL for backend API requests.
- `NEXT_PUBLIC_SOCKET_URL` – WebSocket endpoint, typically `https://${APP_DOMAIN}`.

Ensure these values are set so `npm run build` can generate a production bundle that connects to the correct services.

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
