# Admin Alerts

The admin alerts page surfaces recent warnings and system errors so administrators can diagnose issues quickly.

## Backend

- **Endpoint:** `GET /api/system-errors`
- Located in `backend/src/modules/errorLogs`.
- Reads the last 50 lines of `logs/error.log` and returns them as JSON.
- Route is protected by `verifyToken` and `isAdmin` middleware.

## Frontend

- Page: `frontend/src/pages/admin/alerts.js`
- Uses a Zustand store to fetch and poll the `/api/system-errors` endpoint every minute.
- Results are shown with pagination and color-coded severity levels.
- A back button links to the main admin dashboard.

This feature helps track runtime errors and unusual events in production without server access.
