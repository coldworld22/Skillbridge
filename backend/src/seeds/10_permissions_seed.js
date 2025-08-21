exports.seed = async function(knex) {
  await knex("permissions").del();

  await knex("permissions").insert([
    { code: "view_roles", description: "Read role definitions", created_at: new Date() },
    { code: "manage_roles", description: "Create/update/delete roles", created_at: new Date() },
    { code: "view_permissions", description: "Read permission definitions", created_at: new Date() },
    { code: "manage_permissions", description: "Create/update/delete permissions", created_at: new Date() },
  ]);
};
