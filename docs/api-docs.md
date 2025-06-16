# API Overview

The backend exposes a REST API under the `/api` prefix. Below is a brief outline of the main routes. For the complete specification see `backend/src/docs/swagger.yaml`.

## Authentication

`/api/auth`

- `POST /register` – create a new user
- `POST /login` – authenticate and receive tokens
- `POST /refresh` – refresh an access token
- `POST /logout` – clear the refresh token
- `POST /request-reset` – send a password reset OTP
- `POST /verify-otp` – verify the reset code
- `POST /reset-password` – update the password

## Users

`/api/users`

- `/categories` – browse and manage categories
- `/tutorials` – public tutorial browsing and admin management
- `/classes` – published classes and enrollment
- `/admin` – administrator dashboard features
- `/instructor` – instructor tools
- `/student` – student account endpoints

## Booking Management

`/api/bookings/admin` – CRUD operations for session bookings (admin only).

## Payment Management

`/api/payments/admin` – CRUD operations for user payments (admin only).

## Community Management

`/api/community/admin` – manage announcements, reports, tags and settings.

## Verification

`/api/verify` – send and confirm OTP codes for email or phone verification.

## Health Check

`GET /` – returns a simple message confirming that the API is running.
