# Class Plan Coverage

Classes can be either paid or included for free with specific subscription plans. Two fields control this behaviour:

- `access_type` – defines whether the class requires direct payment or is available through a plan. Values:
  - `paid` – students must purchase the class individually.
  - `free` – the class is available at no additional cost for members of selected plans.
- `included_plans` – array of plan slugs or IDs that grant free access when `access_type` is `free`.

During class creation or update, admins can select the plans that include the class. The frontend fetches available plan identifiers from `/plans/identifiers` to populate this list.

When `access_type` is `free`, the class price is automatically set to `0` on the backend, ensuring students with the listed plans can access it without payment. For all other classes the `price` field determines the cost.
