# Admin Ads Management

This page describes how advertisement banners are managed within the admin dashboard.

## Backend

- Routes and controllers live in `backend/src/modules/ads`.
- Creating, updating or deleting an ad now sends a notification to the ad creator and to all admin users.
- The `GET /api/ads/admin` endpoint accepts an optional `role` query to
  filter ads targeted to `student` or `instructor` roles.

## Frontend

- UI pages are located in `frontend/src/pages/dashboard/admin/ads`.
- `index.js` lists existing ads with filtering and pagination. Actions such as deleting or toggling status display toast notifications and trigger backend notifications.
- `create.js` allows adding new ads with image uploads.

All actions are backed by `frontend/src/services/admin/adService.js` which communicates with the API.
