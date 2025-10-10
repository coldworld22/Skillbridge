# Class Plan Coverage

Classes can be either paid or included for free with specific subscription plans. Two fields control this behaviour:

- `access_type` – defines the default access model for a class:
  - `paid` – students without a subscription must purchase the class individually (plan members listed in `included_plans` are still covered).
  - `free` – only members of the selected plans can join the class, at no additional cost.
- `included_plans` – array of plan slugs or IDs that grant plan subscribers free access. At least one plan is required when `access_type` is `free`, but the list is optional for paid classes.

During class creation or update, admins can select the plans that include the class. The frontend fetches available plan identifiers from `/plans/identifiers` to populate this list.

When `access_type` is `free`, the class price is automatically set to `0` on the backend, ensuring students with the listed plans can access it without payment. Paid classes may still list `included_plans`; in that case, subscribers can enroll without a separate payment, while everyone else follows the normal checkout flow.
