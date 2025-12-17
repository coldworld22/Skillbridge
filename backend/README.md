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
- `DATABASE_URL` – PostgreSQL connection string (use `TEST_DATABASE_URL` when running tests)
- `PORT` – port for the HTTP server
- `SESSION_SECRET` – session cookie signing secret

Provide these variables via a `.env` file or the hosting environment.

The `/api/system-errors` route reads the latest lines from `logs/error.log` and is used by the admin alerts page. Only authenticated admins can access it.

### Bank transfer receipts

Students can upload proof of manual transfers via `POST /api/payments/student/receipts` using a multipart form field named `receipt`. The uploaded file URL can then be referenced by admins when recording payments. Each payment may optionally store this URL in the new `receipt_url` column.

### Request body limits

The Express server parses JSON and URL-encoded bodies with a configurable size cap.  By default the limit is set to **25 MB**, which is large enough for the admin class builder (rich text descriptions can embed sizable HTML payloads).  If you need to accept larger requests set the `DEFAULT_BODY_LIMIT` environment variable to a higher value understood by [`bytes`](https://www.npmjs.com/package/bytes) (for example `50mb`).

### PayPal and crypto payments

- Students can initiate PayPal payments via `POST /api/payments/paypal/create`. The endpoint returns an approval URL and records the pending payment. PayPal redirects to `/api/payments/paypal/callback` after approval.
- The integration uses the official `@paypal/paypal-server-sdk` library to create and capture orders against PayPal's REST APIs.
- Crypto payments use NOWPayments through `POST /api/payments/nowpayments/create` with webhook notifications to `/api/payments/nowpayments/ipn`.

### Failed login attempt cleanup

Authentication keeps a short-lived in-memory map of failed login attempts. Each entry stores timestamps of failed tries and a `lockUntil` field. A background task runs every minute to remove entries whose lock has expired, preventing unbounded growth of this map.
