# Student Online Class Journey

This document walks through the complete experience a learner has when taking an online class on SkillBridge, starting from discovery and exploration, moving through enrollment and payment, and finishing with the first post-purchase touchpoints.

## 1. Discovering & Exploring Classes
1. **Landing and browsing.** Students arrive on the marketing site or the logged-in dashboard and browse the public class catalog. Filters by category, price, start date, delivery format, and instructor reputation help narrow the list.
2. **Previewing class details.** Each class page summarizes the syllabus, instructor biography, pricing, prerequisites, seat availability, language, and learner reviews. Preview lessons or downloadable brochures give a sense of the content depth.
3. **Comparing options.** Students can save classes to a wishlist or compare schedules and prices side-by-side. Conflict warnings inform the learner if two desired classes overlap or exceed personal time commitments.
4. **Assessing fit.** Diagnostic quizzes or readiness checklists, where enabled, confirm whether the learner meets prerequisites. FAQs, community Q&A, and chat with advisors address questions before purchase.

## 2. Account Creation & Profile Completion
1. **Registration.** New visitors sign up using email/password or single sign-on providers (Google, LinkedIn, etc.). Email verification and CAPTCHA prevent fraudulent signups.
2. **Profile enrichment.** Students fill in contact information, learning goals, time zone, and billing address. These details personalize class recommendations and pre-fill checkout forms.
3. **Compliance checks.** For regulated subjects, the platform may require identity verification or agreement to specific terms before enabling checkout.

## 3. Enrollment Intent & Cart Management
1. **Adding to cart.** From the class details page, the student adds the session to their cart. The system validates seat availability and ensures prerequisite classes are complete.
2. **Cart review.** The cart displays each class, schedule, seat count, discounts, taxes, and the total due. Learners can update quantities (for team purchases), apply coupon codes, or remove items.
3. **Price locks and deadlines.** A timer communicates how long the seat and promotional pricing remain reserved. Notifications warn the student if a class is near capacity or the enrollment deadline is approaching.

## 4. Checkout Preparation
1. **Billing information.** Students confirm their billing address, tax ID (if applicable), and choose an invoice recipient. Saved payment methods or corporate billing accounts can be selected here.
2. **Policy acknowledgment.** The checkout page displays refund terms, class cancellation policies, and code of conduct. Students must accept these terms before proceeding.
3. **Support escalation.** A help link connects learners to live chat or ticketing if they encounter billing questions before submitting payment.

## 5. Payment Handling
1. **Payment method selection.** The platform surfaces supported gateways (credit/debit card, bank transfer, PayPal, wallet credits, or corporate purchase orders). The system checks gateway availability by region and currency.
2. **Secure processing.** Sensitive card data is tokenized via the payment processor. 3-D Secure or OTP challenges are triggered as required to comply with Strong Customer Authentication (SCA) rules.
3. **Fraud and risk checks.** Orders pass through fraud scoring, velocity limits, and blacklist checks. Suspicious transactions are placed on hold for manual review, and the learner is notified of the delay.
4. **Payment confirmation.** On approval, the payment gateway sends a success callback. The platform issues a receipt email, creates ledger entries, and marks the order as paid. If the gateway declines, descriptive error messaging guides the student to retry or use another method.
5. **Refund safeguards.** The system stores payment intent IDs so refunds or partial credits can be initiated later. Learners receive confirmation when refunds are processed, along with expected settlement timelines.

## 6. Post-Payment Onboarding
1. **Enrollment activation.** Successful payment automatically enrolls the student, creates a record in `class_enrollments`, and unlocks the class dashboard with schedules, resources, and community forums.
2. **Welcome sequence.** Students receive a welcome email containing the class start date, instructor contact, preparation checklist, and links to orientation materials. Calendar invites are generated when the class has live sessions.
3. **Access to materials.** Immediate access is granted to pre-class materials, such as recorded intro videos, reading lists, or practice quizzes. Progress tracking starts once the student launches the first module.
4. **Support channels.** A dedicated support widget highlights ways to contact instructors, teaching assistants, or success coaches. Escalation paths exist for billing issues post-purchase.

## 7. Monitoring & Iteration
1. **Analytics for improvement.** Product teams monitor funnel metrics—catalog views, add-to-cart rates, checkout abandonment, payment success, and refund incidence—to identify friction points.
2. **Continuous messaging updates.** Copy on the catalog, cart, and payment screens is refined to address the most common objections or errors (e.g., clarifying refund windows, highlighting secure payment).
3. **Learner feedback loop.** Post-purchase surveys capture the student’s confidence in their choice and the clarity of payment steps. Insights feed into UX updates, support training, and automation tweaks.

By mapping every touchpoint—from exploration through payment and immediate onboarding—the team can spot missing messaging, eliminate confusion, and deliver a seamless enrollment experience that builds trust with students.
