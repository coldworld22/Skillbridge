const normalizeRole = (role) =>
  typeof role === "string" ? role.toLowerCase().replace(/\s+/g, "") : "";

const isAdminRole = (roles = []) => {
  const arr = Array.isArray(roles) ? roles : [roles];
  return arr
    .map((r) => normalizeRole(r))
    .some((r) => ["admin", "superadmin"].includes(r));
};

module.exports = {
  normalizeRole,
  isAdminRole,
};
