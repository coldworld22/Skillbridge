# API Overview

The backend exposes a REST API under the `/api` prefix. Below is a brief outline of the main routes. For the complete specification see `backend/src/docs/swagger.yaml`.

## Authentication

`/api/auth`

- `POST /register` – create a new user
- `POST /login` – authenticate and receive tokens
- `POST /refresh` – refresh an access token
- `POST /logout` – clear the refresh token
- `POST /request-reset` – send a password reset OTP *(legacy)*
- `POST /forgot-password` – send a password reset OTP via email
- `POST /verify-otp` – verify the reset code
- `POST /reset-password` – update the password

## Users

`/api/users`

- `/categories` – browse and manage categories
- `/tutorials` – public tutorial browsing and admin management
- `/classes` – published classes and enrollment
  - `GET /api/users/classes` – list published classes
  - `GET /api/users/classes/:id` – view details for a published class
  - `POST /api/users/classes/admin` – create a class (instructor or admin)
  - `PUT /api/users/classes/admin/:id` – update a class
  - `DELETE /api/users/classes/admin/:id` – remove a class
  - `GET /api/users/classes/admin/my` – list classes for the logged in instructor
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

## Offers

`/api/offers`

- `GET /api/offers` – list open offers
- `POST /api/offers` – create a new offer (auth required)
- `GET /api/offers/:id` – view offer details
- `PUT /api/offers/:id` – update an existing offer
- `DELETE /api/offers/:id` – remove an offer
- `GET /api/offers/:offerId/responses` – list responses for an offer
- `POST /api/offers/:offerId/responses` – create a response
- `GET /api/offers/:offerId/responses/:responseId/messages` – list offer messages
- `POST /api/offers/:offerId/responses/:responseId/messages` – send a message
- `DELETE /api/offers/:offerId/responses/:responseId/messages/:messageId` – delete a message you sent
