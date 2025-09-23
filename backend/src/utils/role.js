const ROLE_PRIORITY = ["superadmin", "admin", "instructor", "student"];

const normalizeRole = (role) =>
  typeof role === "string" ? role.toLowerCase().replace(/\s+/g, "") : "";

const isAdminRole = (roles = []) => {
  const arr = Array.isArray(roles) ? roles : [roles];
  return arr
    .map((r) => normalizeRole(r))
    .some((r) => ["admin", "superadmin"].includes(r));
};

const resolvePrimaryRole = (roles = [], fallback) => {
  const arr = (Array.isArray(roles) ? roles : [roles]).filter(Boolean);
  if (!arr.length) {
    return fallback;
  }

  const normalized = arr.map((role) => ({
    original: role,
    normalized: normalizeRole(role),
  }));

  for (const desired of ROLE_PRIORITY) {
    const match = normalized.find((entry) => entry.normalized === desired);
    if (match) {
      return match.original;
    }
  }

  return normalized[0]?.original ?? fallback;
};

module.exports = {
  normalizeRole,
  isAdminRole,
  resolvePrimaryRole,
  ROLE_PRIORITY,
};
