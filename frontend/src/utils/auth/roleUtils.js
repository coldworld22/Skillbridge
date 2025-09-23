const normalizeRole = (role) => {
  if (role == null) {
    return "";
  }

  return String(role).toLowerCase().replace(/\s+/g, "");
};

export const getNormalizedRoles = (user) => {
  if (!user) {
    return [];
  }

  const roles = Array.isArray(user.roles) && user.roles.length > 0
    ? user.roles
    : [user.role];

  const normalized = roles
    .map(normalizeRole)
    .filter((role) => Boolean(role));

  return Array.from(new Set(normalized));
};

export const getPrimaryRole = (user) => {
  const normalizedRoles = getNormalizedRoles(user);

  if (normalizedRoles.includes("superadmin")) {
    return "superadmin";
  }

  return normalizedRoles[0];
};

export default getNormalizedRoles;
