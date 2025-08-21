exports.seed = async function(knex) {
  await knex("role_permissions").del();

  const roles = await knex("roles").select("id", "name");
  const permissions = await knex("permissions").select("id", "code");

  const roleId = (name) => roles.find((r) => r.name === name).id;
  const rows = [];

  permissions.forEach((p) => {
    ["SuperAdmin", "Admin"].forEach((name) => {
      rows.push({ role_id: roleId(name), permission_id: p.id });
    });
  });

  await knex("role_permissions").insert(rows);
};
