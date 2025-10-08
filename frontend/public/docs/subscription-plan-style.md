# Subscription Plan Style Configuration

Subscription plans have optional fields that control how they appear on the website pricing page:

- **color** – background color of the plan card.
- **style** – JSON string with additional visual settings:
  - `textColor` – text color for the card contents.
  - `gradientStart`/`gradientEnd` – optional gradient background.
  - `buttonColor` – subscription button background color.
  - `buttonTextColor` – subscription button text color.

Administrators can set these values when creating or editing a plan from
`/dashboard/admin/plans`. The `SubscriptionPlans` component automatically
uses these fields, so adjusting them in the dashboard updates the site
without code changes.
