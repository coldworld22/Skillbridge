# Student Class Purchase & Enrollment Workflow

This document outlines the typical flow a student follows when purchasing or enrolling in a class through SkillBridge.

## 1. Discover Classes
- Browse `/classes` on the main website or homepage.
- Filter by category, level, instructor and price.
- Logged-in users can add classes to their wishlist.
- Open a class to view details via `/classes/[id]`.

## 2. View Class Details
A class detail page displays:
- Full description and instructor bio.
- Curriculum and lessons list.
- Student reviews and requirements.
- Schedule information (online or offline).

Actions available:
- **Add to Cart** if the class is paid.
- **Enroll Directly** if the class is free.

## 3. Cart System
On `/cart` students can review selected classes:
- See title, price and instructor information.
- Remove classes if needed.
- View the total price and proceed to checkout.

## 4. Checkout
The `/checkout` page requires the student to be logged in. A completed profile may also be required. Students select a payment method, confirm billing details and review their order summary before proceeding.

## 5. Payment Gateway
Students are redirected to the configured payment processor (Stripe, Tap, PayPal or an NFT wallet). On successful payment they return to `/checkout/success` where the order is saved and the student is officially enrolled. Failures redirect to `/checkout/failure` with options to retry or contact support.

## 6. Order & Invoicing
- Administrators can view orders under `/dashboard/admin/orders`.
- Students can download invoices from `/dashboard/student/invoices`.
- Email confirmations and receipts are automatically sent.
- Instructors may be notified of new students.

## 7. Student Class Access
Once payment is confirmed, students appear in the class's roster and gain access to:
- The classroom page `/dashboard/student/classes/[id]`.
- Lessons, resources and assignments.
- Certificate eligibility when applicable.

Optional enhancements include guest checkout, coupon codes, a wallet/credits system and automated reminders for upcoming classes.

