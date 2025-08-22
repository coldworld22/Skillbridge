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
  ]);
};
