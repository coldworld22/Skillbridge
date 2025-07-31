# Coupon Management

This document explains how discount coupons are handled in SkillBridge.

## Backend

- **Routes** live in `backend/src/modules/coupons`.
- Admins and instructors use `/api/coupons/admin` for CRUD operations.
- `GET /api/coupons/code/:code` validates a coupon for checkout.
- Coupons include an optional `instructor_id` so instructors can create their own codes.
- `starts_at` and `expires_at` define the active window for a coupon.
- `applies_to` (with optional `applies_to_id`) restricts the coupon to a plan, class or tutorial.

## Frontend

- API helpers will be located in `frontend/src/services/admin/couponService.js` and `frontend/src/services/instructor/couponService.js`.
- Dashboard pages under `frontend/src/pages/dashboard/admin/coupons` and `frontend/src/pages/dashboard/instructor/coupons` will allow managing coupons.
- The checkout page reads promo codes via `couponService.validateCode` and applies the discount.

A seed file (`07_coupons_seed.js`) creates a demo code `DISCOUNT10` for testing.
