# Admin Dashboard Troubleshooting Guide

This guide explains the repeating network errors that appear in the browser console when the
admin dashboard cannot reach the backend. Each section describes what the error means, why it
happens in the current codebase, and how to diagnose the root cause.

## Symptoms

When the issue is present you will typically see a burst of messages similar to the following:

- `401` responses from `POST /api/auth/refresh`
- Multiple `502` responses from admin-only APIs such as `/api/users/admin/dashboard-stats`,
  `/api/license/status`, `/api/messages`, `/api/notifications`, and `/api/popup-announcements`
- Failed image downloads from `/api/uploads/...` and avatar URLs
- Socket.IO connection failures to `wss://eduskillbridge.net/socket.io`
- Intermittent `ERR_HTTP2_PROTOCOL_ERROR` responses while the browser retries requests

The remaining sections map those symptoms to specific backend behaviours.

## `401` on `/api/auth/refresh`

The refresh route expects a valid `refreshToken` cookie. When the cookie is missing or the token
is invalid/expired the controller returns a `401` with `"Missing refresh token"` or
`"Invalid or expired refresh token"`.【F:backend/src/modules/auth/controllers/auth.controller.js†L63-L90】

Check the following when you hit the `401` loop:

1. Confirm that the browser still has a `refreshToken` cookie for the API domain. Any proxy or
   domain mismatch prevents the cookie from being sent.
2. Verify that the refresh token in the database has not been revoked or expired. The
   `rotateRefreshToken` service call will reject invalid tokens, which immediately surfaces as a
   `401` and stops the dashboard from bootstrapping user data.
3. If you manually cleared cookies or rotated secrets, sign in again to issue a fresh refresh
   token.

## `502` on admin REST endpoints

Every failing admin API request (`/api/users/admin/users`, `/api/users/admin/dashboard-stats`,
`/api/moderation/flags`, `/api/license/status`, etc.) is reverse-proxied through Nginx to the
Express backend container running on `backend:5002`.【F:nginx/conf.d/ssl.conf†L22-L41】

A `502` indicates that Nginx could not get a healthy response from the upstream backend. In this
project the Express server exits or throws a `500` when critical dependencies are missing, which
manifests as `502` in the browser. Focus on these areas:

- **Environment variables** – the server aborts startup if `JWT_SECRET`, `REFRESH_TOKEN_SECRET`,
  `SESSION_SECRET`, or the appropriate `DATABASE_URL`/`TEST_DATABASE_URL` entries are missing.【F:backend/src/server.js†L24-L42】
- **Redis** – in production the code requires `REDIS_URL`; missing it raises an error before the
  server can accept requests.【F:backend/src/server.js†L91-L106】
- **Database connectivity** – the Knex layer verifies connectivity at startup and retries a few
  times. If it cannot reach PostgreSQL the process exits, leaving Nginx with an unavailable
  upstream.【F:backend/src/config/database.js†L1-L37】【F:backend/src/server.js†L144-L179】
- **Pending migrations** – the server continues to run with pending migrations but logs a warning.
  Apply migrations if new tables are required for the admin pages.
- **License checks** – routes such as `/api/license/status` rely on the `licenses` and
  `suspicious_logs` tables via the license service. A missing table or failing query will surface
  as a backend error that appears as `502`.【F:backend/src/modules/license/license.controller.js†L68-L83】【F:backend/src/modules/license/license.service.js†L1-L39】

Review the backend logs (`docker compose logs backend` or the `/api/system-errors` endpoint once the
server responds) to confirm which dependency is failing.

## Image and upload errors

The `/api/uploads/...` paths are served from the backend Express app with a guard that rejects
requests while the server is down or restarting.【F:backend/src/server.js†L112-L140】 Any `502`
response on an upload request therefore shares the same root cause as the API failures above. Once
the backend starts successfully the static files become available again.

## Socket.IO connection failures

The Socket.IO gateway is initialised inside the backend server and shares the same lifecycle as the
REST API. It stores active connections and participants in memory and persists certain events to the
PostgreSQL database.【F:backend/src/sockets/index.js†L1-L77】 When the backend cannot start or loses
its database connection the Socket.IO server never becomes available, so the browser reports
`WebSocket connection ... failed`.

## HTTP/2 protocol errors

The `ERR_HTTP2_PROTOCOL_ERROR` messages are a follow-on symptom of the upstream backend crashing or
restarting. Because Nginx terminates TLS/HTTP2 and proxies requests to the backend over HTTP/1.1,
any abrupt upstream disconnect appears to the browser as an HTTP/2 protocol error rather than a
simple `502` response.【F:nginx/conf.d/ssl.conf†L22-L41】 Restarting the backend so it responds
consistently clears these errors.

## Recommended recovery steps

1. Inspect the backend container logs for missing environment variables, database connectivity
   errors, or Redis failures.
2. Ensure PostgreSQL is reachable and that `npm run migrate` has been executed so the `licenses`,
   `suspicious_logs`, `video_call_participants`, and related tables exist before the admin dashboard
   loads.
3. Reissue admin credentials if refresh tokens were invalidated (log out/in or clear cookies and
   sign in again).
4. Confirm that the TLS certificates and Nginx configuration still point to the correct backend
   hostnames, matching the cookie domain expected by the frontend.

Following the checklist above resolves the authentication loop and brings the admin dashboard APIs
back online in staging and production environments.
