const PROFILE_COMPLETION_PATHS = {
  admin: "/dashboard/admin/profile/edit",
  instructor: "/dashboard/instructor/profile/edit",
  student: "/dashboard/student/profile/edit",
  superadmin: "/dashboard/admin/profile/edit",
};

const DASHBOARD_ROUTES = {
  admin: "/dashboard/admin",
  superadmin: "/dashboard/admin",
  instructor: "/dashboard/instructor",
  student: "/dashboard/student",
};

export const sanitizeRedirectPath = (value) => {
  if (typeof value !== "string") return null;
  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    decoded = value;
  }
  const trimmed = decoded.trim();
  if (!trimmed) return null;
  if (!trimmed.startsWith("/")) return null;
  if (trimmed.startsWith("//")) return null;
  if (/^[a-z]+:\/\//i.test(trimmed)) return null;
  if (/[\r\n]/.test(trimmed)) return null;
  if (trimmed.length > 1024) return null;
  return trimmed;
};

export const getProfileCompletionPath = (role) => {
  const normalized = typeof role === "string" ? role.toLowerCase() : "";
  return PROFILE_COMPLETION_PATHS[normalized] || null;
};

const getDashboardRoute = (role) => {
  const normalized = typeof role === "string" ? role.toLowerCase() : "";
  return DASHBOARD_ROUTES[normalized] || null;
};

export const getPostLoginDestination = ({ user, redirectPath }) => {
  if (!user) return "/auth/login";
  const profilePath = getProfileCompletionPath(user.role);

  if (user.profile_complete === false && profilePath) {
    return profilePath;
  }

  if (user.profile_complete === false) {
    return "/website";
  }

  if (!user.is_email_verified) {
    return "/auth/verify-email";
  }

  if (redirectPath) {
    return redirectPath;
  }

  return getDashboardRoute(user.role) || "/website";
};
