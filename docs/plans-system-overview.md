# Subscription plan system overview

The SkillBridge subscription stack now offers a role-aware catalogue that ties the majority of
platform features directly to plan configuration. This document explains the moving parts so
product, engineering, and support teams can evolve the catalogue confidently.

## Data model recap

| Table | Purpose | Highlights |
|-------|---------|------------|
| `plans` | Defines the public catalogue | Segmented by `target_role` (student or instructor), stores pricing, styling, and instructor allowances (`max_courses`, `ad_credits`). |
| `plan_features` | Feature toggles and quotas | Key/value pairs (stored as strings) that unlock modules such as ads, community, groups, tutorials, and more. |
| `user_subscriptions` | Active subscriptions | Links a user to a plan instance and records billing interval. |
| `plan_usage_metrics` | Included item usage | Tracks how many plan-covered books, classes, or tutorials a subscriber has consumed. |

> **Tip:** Feature values are normalised at runtime. Booleans can be written as `"true"`/`"false"`,
numeric quotas as strings (for example `"5"`), and unlimited allowances as `"null"`.

## Feature catalogue

The seed file `backend/src/seeds/09_plans_seed.js` now seeds a cohesive catalogue for both
instructors and students:

- Community participation (`community_post`)
- Group creation and join limits (`groups_create`, `groups_join_limit`)
- Class authoring (`classes_create`) with course caps via `max_courses`
- Book downloads for students (`books_download`)
- Ad management controls (`ads_max_ads`, `ads_max_duration`, `ads_allow_branding`, `ads_show_analytics`, `ad_credits`)
- Tutorial creation, including plan-specific publish limits (`tutorials_create`, `tutorials_max_count`)
- Platform commissions (`commission_rate`)

When you need a new toggle, add it to the seed and gate the relevant module with
`parsePlanFeatures`.

## Shared helper utilities

- `backend/src/modules/plans/planContent.helper.js` normalises `included_plans` references and
groups any catalogued content by plan. This is used by `plans.service` to hydrate the public API.
- `backend/src/modules/plans/plans.service.js` now attaches `included_classes`,
  `included_books`, and `included_tutorials` whenever plans are retrieved, so the UI can promote
  everything a subscriber receives at a glance.

These helpers have dedicated unit tests in
`backend/src/modules/plans/__tests__/planContent.helper.test.js` to protect against regressions.

## Front-end experience

- `frontend/src/services/public/planService.js` converts media URLs for classes, tutorials, and
  books so plan cards can display thumbnails reliably.
- `frontend/src/components/website/sections/SubscriptionPlans.js` renders the enriched plan data,
  highlighting featured classes, tutorials, and books alongside the feature list.
- Localised strings for the new sections live in `frontend/public/locales/*/website.json`.

## How gating works across modules

| Module | Feature check |
|--------|---------------|
| Ads (`backend/src/modules/ads/ads.controller.js`) | `ads_max_ads`, `ads_max_duration`, `ads_allow_branding`, `ads_show_analytics`, and `ad_credits` |
| Community (`backend/src/modules/community/public/public.controller.js`) | `community_post` |
| Groups (`backend/src/modules/groups/groups.controller.js`) | `groups_create`, `groups_join_limit` |
| Classes (`backend/src/modules/classes/class.controller.js`) | `classes_create` + `max_courses` |
| Tutorials (`backend/src/modules/users/tutorials/tutorial.controller.js`) | `tutorials_create`, `tutorials_max_count` |
| Books (`backend/src/modules/books/book.service.js`) | Subscription coverage handled via `plan_usage_metrics` |

When you add a new premium capability, create a plan feature key, seed default values, and check
it at the service layer before performing the action.

## Separating instructor and student plans

`target_role` keeps the catalogue logically split:

- API clients can request `/plans?role=student` or `/plans?role=instructor` to fetch the relevant
  catalogue.
- The pricing UI renders student plans on the marketing site and instructor plans inside the
  instructor dashboard.
- Checkout flows stamp subscriptions with the plan role so billing, renewals, and analytics can
  segment revenue automatically.

With these foundations, the platform has a professional, extensible plan system where every
feature and content perk is anchored to the subscription engine.
