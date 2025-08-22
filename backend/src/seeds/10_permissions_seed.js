exports.seed = async function(knex) {
  await knex("permissions").del();

  await knex("permissions").insert([
    { code: "view_roles", description: "Read role definitions", created_at: new Date() },
    { code: "manage_roles", description: "Create/update/delete roles", created_at: new Date() },
    { code: "view_permissions", description: "Read permission definitions", created_at: new Date() },
    { code: "manage_permissions", description: "Create/update/delete permissions", created_at: new Date() },
    { code: "view_online_classes", description: "View online classes", created_at: new Date() },
    {
      code: "manage_online_classes",
      description: "Create/update/delete online classes",
      created_at: new Date(),
    },
    { code: "view_tutorials", description: "View tutorials", created_at: new Date() },
    {
      code: "manage_tutorials",
      description: "Create/update/delete tutorials",
      created_at: new Date(),
    },
    { code: "view_books", description: "View books", created_at: new Date() },
    {
      code: "manage_books",
      description: "Create/update/delete books",
      created_at: new Date(),
    },
    { code: "view_assignments", description: "View assignments", created_at: new Date() },
    {
      code: "manage_assignments",
      description: "Create/update/delete assignments",
      created_at: new Date(),
    },
    { code: "view_categories", description: "View categories", created_at: new Date() },
    {
      code: "manage_categories",
      description: "Create/update/delete categories",
      created_at: new Date(),
    },
    { code: "view_certificates", description: "View certificates", created_at: new Date() },
    {
      code: "manage_certificates",
      description: "Create/update/delete certificates",
      created_at: new Date(),
    },
    { code: "view_instructors", description: "View instructors", created_at: new Date() },
    {
      code: "manage_instructors",
      description: "Create/update/delete instructors",
      created_at: new Date(),
    },
    { code: "view_users", description: "View users", created_at: new Date() },
    {
      code: "manage_users",
      description: "Create/update/delete users",
      created_at: new Date(),
    },
    { code: "view_bookings", description: "View bookings", created_at: new Date() },
    {
      code: "manage_bookings",
      description: "Create/update/delete bookings",
      created_at: new Date(),
    },
    { code: "view_community", description: "View community", created_at: new Date() },
    {
      code: "manage_community",
      description: "Create/update/delete community content",
      created_at: new Date(),
    },
    { code: "view_groups", description: "View community groups", created_at: new Date() },
    {
      code: "manage_groups",
      description: "Create/update/delete community groups",
      created_at: new Date(),
    },
    { code: "view_plans", description: "View subscription plans", created_at: new Date() },
    {
      code: "manage_plans",
      description: "Create/update/delete subscription plans",
      created_at: new Date(),
    },
    { code: "view_payments", description: "View payment configuration", created_at: new Date() },
    {
      code: "manage_payments",
      description: "Update payment configuration",
      created_at: new Date(),
    },
    { code: "view_ads", description: "View ads", created_at: new Date() },
    {
      code: "manage_ads",
      description: "Create/update/delete ads",
      created_at: new Date(),
    },
    { code: "view_offers", description: "View offers", created_at: new Date() },
    {
      code: "manage_offers",
      description: "Create/update/delete offers",
      created_at: new Date(),
    },
    { code: "view_coupons", description: "View coupons", created_at: new Date() },
    {
      code: "manage_coupons",
      description: "Create/update/delete coupons",
      created_at: new Date(),
    },
    { code: "view_support", description: "View support tickets", created_at: new Date() },
    {
      code: "manage_support",
      description: "Resolve/delete support tickets",
      created_at: new Date(),
    },
    { code: "view_settings", description: "View application settings", created_at: new Date() },
    {
      code: "manage_settings",
      description: "Update application settings",
      created_at: new Date(),
    },
  ]);
};
