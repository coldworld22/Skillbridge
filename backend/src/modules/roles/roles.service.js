const db = require("../../config/database");

exports.createRole = async (data) => {
  const [row] = await db("roles").insert(data).returning("*");
  return row;
};

exports.getRoles = () => {
  return db("roles").select("*").orderBy("id");
};

exports.getRoleById = async (id) => {
  const role = await db("roles").where({ id }).first();
  if (!role) return null;
  const perms = await db("role_permissions")
    .join("permissions", "role_permissions.permission_id", "permissions.id")
    .where("role_permissions.role_id", id)
    .select("permissions.code");
  role.permissions = perms.map((p) => p.code);
  return role;
};

exports.updateRole = async (id, data) => {
  const [row] = await db("roles").where({ id }).update(data).returning("*");
  return row;
};

exports.deleteRole = (id) => db("roles").where({ id }).del();

exports.createPermission = async (data) => {
  const [row] = await db("permissions").insert(data).returning("*");
  return row;
};

exports.getPermissions = () => {
  return db("permissions").select("*").orderBy("id");
};

exports.updatePermission = async (id, data) => {
  const [row] = await db("permissions").where({ id }).update(data).returning("*");
  return row;
};

exports.deletePermission = (id) => db("permissions").where({ id }).del();

exports.assignPermissions = async (roleId, permissionIds, userId) => {
  await db("role_permissions").where({ role_id: roleId }).del();
  const rows = permissionIds.map((pid) => ({
    role_id: roleId,
    permission_id: pid,
    assigned_by: userId,
    assigned_at: new Date(),
  }));
  if (rows.length) await db("role_permissions").insert(rows);
  return exports.getRoleById(roleId);
};
