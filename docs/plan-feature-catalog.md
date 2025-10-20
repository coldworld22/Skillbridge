# Plan Feature Catalog

The subscription system now centralises feature metadata in
`backend/src/modules/plans/planFeatureMetadata.js`. Each plan feature key is
mapped to:

- the platform module it controls (ads, community, classes, tutorials, etc.)
- human friendly labels and descriptions used on the public pricing page
- parsing/formatting logic so booleans, counts, durations, and percentages are
  rendered consistently
- synthetic features derived from plan columns (`max_courses`, `ad_credits`) so
  instructor limits appear alongside database-driven feature flags

The catalog powers:

1. Automatic formatting of `/plans` responses — plan cards include labelled
   features with marketing copy instead of raw values and expose curated
   learning content (classes, tutorials, books) attached to each plan.
2. Admin defaults — when an admin omits a feature description, the metadata file
   supplies one based on the value.
3. Seed data — default plans reuse the same metadata so website copy and runtime
   behaviour stay aligned.

## Feature matrix

| Module | Feature key | Description template |
| --- | --- | --- |
| Commerce | `commission_rate` | `Platform keeps {value} of each sale` |
| Community | `groups_create` | `Create and manage groups` / `Join groups as a member only` |
| Community | `groups_join_limit` | `Join up to {count} groups` or `Join unlimited groups` |
| Community | `community_post` | `Post and reply in discussions` / `Read-only community access` |
| Classes | `classes_create` | `Publish online classes` / `Enroll only (no class publishing)` |
| Tutorials | `tutorials_create` | `Create tutorials with chapters` / `View tutorials only` |
| Tutorials | `tutorials_max_count` | `Publish up to {count} tutorials` or `Unlimited published tutorials` |
| Library | `books_download` | `Download purchased books` / `Read-only access to library` |
| Ads | `ads_max_ads` | `Run up to {count} active ads` or `Run unlimited active ads` |
| Ads | `ads_max_duration` | `Run ads up to {count} days` or `No ad duration limit` |
| Ads | `ads_allow_branding` | `Use custom branding in ads` / `Platform branding only` |
| Ads | `ads_show_analytics` | `Access detailed ad analytics` / `No analytics dashboard` |
| Classes (synthetic) | `max_courses` | `Publish up to X active classes` or `Publish unlimited active classes` |
| Ads (synthetic) | `ad_credits` | `{X} ad credits per billing cycle` or `No ad credits included` |

All templates live alongside the feature definitions so any new feature only
requires editing `planFeatureMetadata.js` (plus seed values where applicable).

## Adding a new plan feature

1. Append the feature definition to `FEATURE_METADATA` with its module, labels,
   and any custom formatting rules.
2. Update `MODULE_ORDER` if the feature belongs to a new module category.
3. Seed the new feature in `backend/src/seeds/09_plans_seed.js` so baseline plans
   include sensible defaults.
4. (Optional) Add a synthetic feature entry in `SYNTHETIC_PLAN_FEATURES` if the
   value comes from a plan column instead of `plan_features`.

The pricing endpoint also decorates each plan with arrays named
`included_classes`, `included_tutorials`, and `included_books`, built via
`planCoverage.helper.js`. These lists contain the most recent approved learning
content that marks the plan as included, so marketing cards can highlight the
real material members unlock.

Because the formatter normalises booleans, numeric limits, durations, and
percentages (and the coverage helper resolves plan IDs/slugs), the public
pricing page automatically reflects the descriptive copy and curated content
without additional frontend changes.
