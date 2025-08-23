# Backend

This folder contains the Express.js API for SkillBridge. Run `npm test` to execute the Jest suite.

The `/api/system-errors` route reads the latest lines from `logs/error.log` and is used by the admin alerts page. Only authenticated admins can access it.

### Bank transfer receipts

Students can upload proof of manual transfers via `POST /api/payments/student/receipts` using a multipart form field named `receipt`. The uploaded file URL can then be referenced by admins when recording payments. Each payment may optionally store this URL in the new `receipt_url` column.

### Failed login attempt cleanup

Authentication keeps a short-lived in-memory map of failed login attempts. Each entry stores timestamps of failed tries and a `lockUntil` field. A background task runs every minute to remove entries whose lock has expired, preventing unbounded growth of this map.
