exports.seed = async function(knex) {
  await knex("role_permissions").del();

  const roles = await knex("roles").select("id", "name");
  const permissions = await knex("permissions").select("id", "code");

  const roleId = (name) => roles.find((r) => r.name === name)?.id;
  const rows = [];

  const superAdminId = roleId("SuperAdmin");
  const adminId = roleId("Admin");

  permissions.forEach((p) => {
    if (superAdminId) {
      rows.push({ role_id: superAdminId, permission_id: p.id });
    }
    if (adminId && p.code.startsWith("view_")) {
      rows.push({ role_id: adminId, permission_id: p.id });
    }
  });

  await knex("role_permissions").insert(rows);
};
