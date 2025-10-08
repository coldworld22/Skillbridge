# Admin Dashboard Error Troubleshooting

This guide summarizes the most common network console errors reported from the hosted admin dashboard and maps them to the backend behaviour of the SkillBridge stack. Use it when you see repeated `Failed to load resource` or WebSocket failures while loading the dashboard.

## 401 errors from `/api/auth/refresh`
- **What it means:** the browser attempted to rotate the refresh token but the backend rejected it. The controller returns `401 Invalid or expired refresh token` whenever the `refreshToken` cookie is missing, expired, or the rotation step throws. This is defined in [`src/modules/auth/controllers/auth.controller.js`](../backend/src/modules/auth/controllers/auth.controller.js).
- **How to fix:** ensure the refresh token cookie still exists and matches what is stored in the database. Users who have been idle for several hours will need to log in again. Clear cookies and re-authenticate if you continue to see 401 responses.

## 502 errors from `/api/...`
- **What it means:** the nginx reverse proxy cannot get a healthy response from the Node backend, so it propagates a `502 Bad Gateway`. This commonly happens when:
  - the backend service is down or restarting;
  - the backend throws an uncaught exception before replying;
  - upstream dependencies (PostgreSQL, Redis, third-party APIs) are unreachable and the backend bubbles up the error.
- **How to fix:**
  1. Check that the `backend` container is running (`docker compose ps`) and review logs (`docker compose logs backend`).
  2. Confirm the database and cache containers are healthy and reachable.
  3. Look at the backend log output for the specific endpoint that failed—the stack trace will usually precede the 502 in nginx.

## `net::ERR_HTTP2_PROTOCOL_ERROR`
- **What it means:** the browser opened an HTTP/2 stream (for example, an image or `/api/app-config`) but the connection was interrupted unexpectedly. This typically happens when nginx terminates the request because the upstream crashed mid-response or returned an invalid header.
- **How to fix:** resolve the underlying 502/back-end crash. Once the API responds consistently, HTTP/2 requests will succeed.

## WebSocket connection failures
- **Symptoms:** `WebSocket connection to 'wss://eduskillbridge.net/socket.io/?EIO=4&transport=websocket' failed`.
- **What it means:** the Socket.IO server that lives in the backend (`src/sockets/index.js`) was unreachable during the HTTP upgrade. The cause is usually the same downtime that produces the 502 errors.
- **How to fix:** once the backend service is online and healthy, the WebSocket handshake will succeed. If nginx is terminating the upgrade, confirm that the `nginx` configuration is up to date and that port `3000` is exposed inside the Docker network.

## Why multiple dashboard calls fail together
The admin dashboard issues several parallel requests (`/api/users/admin/dashboard-stats`, `/api/messages`, `/api/notifications`, etc.) immediately after boot. When the refresh token cannot be exchanged **and** the backend is unavailable, every call fails at once, producing the dense error list observed. Restoring the backend service and forcing a new login resolves the cascade of failures.

## Next steps when the issue reoccurs
1. Verify infrastructure health (Docker containers, database, Redis, third-party integrations).
2. Inspect backend logs around the time of the first 502 to spot the root cause (uncaught exception, migration pending, network outage).
3. Rotate credentials (refresh tokens, API keys) if log messages mention invalid or expired secrets.
4. After remediation, clear the browser storage and sign back into the dashboard to confirm all endpoints succeed.

Keeping the backend service healthy and the refresh token valid prevents the console spam seen in the reported output.
