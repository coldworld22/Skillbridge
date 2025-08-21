exports.seed = async function(knex) {
  await knex("role_permissions").del();

  const roles = await knex("roles").select("id", "name");
  const permissions = await knex("permissions").select("id", "code");

  const roleId = (name) => roles.find((r) => r.name === name).id;
  const permId = (code) => permissions.find((p) => p.code === code).id;

  const rows = [];

  permissions.forEach((p) => {
    rows.push({ role_id: roleId("SuperAdmin"), permission_id: permId(p.code) });
  });

  ["view_roles", "view_permissions"].forEach((code) => {
    rows.push({ role_id: roleId("Admin"), permission_id: permId(code) });
  });

  await knex("role_permissions").insert(rows);
};
