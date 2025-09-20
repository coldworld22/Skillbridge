# Backend

This folder contains the Express.js API for SkillBridge. Run `npm test` to execute the Jest suite.

## Setup

Install the backend dependencies:

```bash
npm install
```

### Required environment variables

The server validates these values at startup and exits with a clear error if
any are missing:

- `JWT_SECRET` – signing key for access tokens
- `REFRESH_TOKEN_SECRET` – signing key for refresh tokens
- Database connection details – either provide a full connection string via `DATABASE_URL`/`PRODUCTION_DATABASE_URL` (and `TEST_DATABASE_URL` when running tests) or set the individual `POSTGRES_*` variables so the server can build one automatically.
- `BACKEND_PORT` – port for the HTTP server
- `SESSION_SECRET` – session cookie signing secret

Provide these variables via a `.env` file or the hosting environment.

The `/api/system-errors` route reads the latest lines from `logs/error.log` and is used by the admin alerts page. Only authenticated admins can access it.

### Rate limiting

The global rate limiter defaults to a generous ceiling so development and production traffic remain responsive. Tune these variables to fit your deployment:

- `RATE_LIMIT_MAX_REQUESTS` – maximum number of requests allowed per IP during the window (default: `1000`).
- `RATE_LIMIT_WINDOW_MINUTES` – rolling window length for the limiter in minutes (default: `15`).

Raising the values increases the burst capacity, while lowering them provides stricter protection against abusive clients.

### Bank transfer receipts

Students can upload proof of manual transfers via `POST /api/payments/student/receipts` using a multipart form field named `receipt`. The uploaded file URL can then be referenced by admins when recording payments. Each payment may optionally store this URL in the new `receipt_url` column.

### PayPal and crypto payments

- Students can initiate PayPal payments via `POST /api/payments/paypal/create`. The endpoint returns an approval URL and records the pending payment. PayPal redirects to `/api/payments/paypal/callback` after approval.
- The integration uses the official `@paypal/paypal-server-sdk` library to create and capture orders against PayPal's REST APIs.
- Crypto payments use NOWPayments through `POST /api/payments/nowpayments/create` with webhook notifications to `/api/payments/nowpayments/ipn`.

### Failed login attempt cleanup

Authentication keeps a short-lived in-memory map of failed login attempts. Each entry stores timestamps of failed tries and a `lockUntil` field. A background task runs every minute to remove entries whose lock has expired, preventing unbounded growth of this map.
