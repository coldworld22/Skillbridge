import { ADMIN_PERMISSIONS } from "@/constants/adminPermissions";

const MANAGE_KEYWORDS = new Set([
  "create",
  "edit",
  "new",
  "settings",
  "configure",
  "issue-manual",
  "add",
  "change-password",
  "purchase",
  "approve",
  "reject",
  "restore",
  "reset",
  "manage",
  "upload",
  "assign",
  "activate",
  "deactivate",
  "sync",
]);

const SLUG_PERMISSION_MAP = {
  "online-classes": ADMIN_PERMISSIONS.ONLINE_CLASSES,
  tutorials: ADMIN_PERMISSIONS.TUTORIALS,
  assignments: ADMIN_PERMISSIONS.ASSIGNMENTS,
  certificates: ADMIN_PERMISSIONS.CERTIFICATES,
  categories: ADMIN_PERMISSIONS.CATEGORIES,
  books: ADMIN_PERMISSIONS.BOOKS,
  instructors: ADMIN_PERMISSIONS.INSTRUCTORS,
  users: ADMIN_PERMISSIONS.USERS,
  bookings: ADMIN_PERMISSIONS.BOOKINGS,
  community: ADMIN_PERMISSIONS.COMMUNITY,
  groups: ADMIN_PERMISSIONS.GROUPS,
  messages: ADMIN_PERMISSIONS.MESSAGES,
  notifications: ADMIN_PERMISSIONS.NOTIFICATIONS,
  roles: ADMIN_PERMISSIONS.ROLES,
  permissions: ADMIN_PERMISSIONS.PERMISSIONS,
  plans: ADMIN_PERMISSIONS.PLANS,
  payments: ADMIN_PERMISSIONS.PAYMENTS,
  ads: ADMIN_PERMISSIONS.ADS,
  offers: ADMIN_PERMISSIONS.OFFERS,
  coupons: ADMIN_PERMISSIONS.COUPONS,
  support: ADMIN_PERMISSIONS.SUPPORT,
  currency: ADMIN_PERMISSIONS.CURRENCIES,
};

const SETTINGS_SLUG_PERMISSIONS = {
  languages: ADMIN_PERMISSIONS.LANGUAGES,
  "language-config": ADMIN_PERMISSIONS.LANGUAGE_CONFIG,
  currency: ADMIN_PERMISSIONS.CURRENCIES,
  "social_login": ADMIN_PERMISSIONS.SOCIAL_LOGINS,
  "email-config": ADMIN_PERMISSIONS.EMAIL_CONFIG,
  "messages-config": ADMIN_PERMISSIONS.MESSAGES_CONFIG,
  policies: ADMIN_PERMISSIONS.POLICIES,
  contact: ADMIN_PERMISSIONS.CONTACT_INFO,
  blog: ADMIN_PERMISSIONS.BLOGS,
  faqs: ADMIN_PERMISSIONS.FAQS,
  app: ADMIN_PERMISSIONS.APP_SETTINGS,
  footer: ADMIN_PERMISSIONS.FOOTER_SETTINGS,
  seo: ADMIN_PERMISSIONS.SEO_SETTINGS,
  "popup-announcement": ADMIN_PERMISSIONS.POPUPS,
  certificates: ADMIN_PERMISSIONS.CERTIFICATE_TEMPLATES,
  thirdParty: ADMIN_PERMISSIONS.THIRD_PARTY_CONFIG,
  "tenant-domains": ADMIN_PERMISSIONS.TENANT_DOMAINS,
};

const sanitizePath = (rawPath) => {
  if (!rawPath) return "/";
  const [pathOnly] = rawPath.split("?");
  if (!pathOnly) return "/";
  const trimmed = pathOnly.replace(/\/+$/, "");
  return trimmed || "/";
};

const isSuperAdmin = (user) =>
  (user?.role || user?.roles?.[0] || "")
    .toString()
    .toLowerCase()
    .includes("superadmin");

const hasManageKeyword = (segments) =>
  segments.some((segment) => MANAGE_KEYWORDS.has(segment));

const resolveModulePermission = (entry, segments) => {
  if (!entry) return null;
  if (entry.RULES && segments.includes("rules")) {
    return entry.RULES;
  }
  if (hasManageKeyword(segments) && entry.MANAGE) {
    return entry.MANAGE;
  }
  return entry.VIEW || null;
};

export const resolveAdminPermissionForPath = (rawPath) => {
  const path = sanitizePath(rawPath);
  if (!path.startsWith("/dashboard/admin")) {
    return null;
  }

  if (path === "/dashboard/admin") {
    return ADMIN_PERMISSIONS.DASHBOARD.VIEW;
  }

  const segments = path
    .split("/")
    .filter(Boolean)
    .slice(2); // remove 'dashboard', 'admin'

  if (!segments.length) {
    return ADMIN_PERMISSIONS.DASHBOARD.VIEW;
  }

  const [module, ...rest] = segments;

  if (module === "cache") {
    return ADMIN_PERMISSIONS.CACHE.MANAGE;
  }

  if (module === "settings") {
    if (!rest.length) return null;
    const [settingsModule, ...settingsRest] = rest;
    const entry = SETTINGS_SLUG_PERMISSIONS[settingsModule];
    return resolveModulePermission(entry, settingsRest);
  }

  const entry = SLUG_PERMISSION_MAP[module];
  return resolveModulePermission(entry, rest);
};

export const userHasPermissionForPath = (user, path) => {
  const required = resolveAdminPermissionForPath(path);
  if (!required) return true;
  if (isSuperAdmin(user)) return true;
  const perms = user?.permissions || [];
  return perms.includes(required);
};

export const shouldDisplayNavItem = (user, requiredPermissions = []) => {
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true;
  }
  if (isSuperAdmin(user)) {
    return true;
  }
  const userPerms = user?.permissions || [];
  return requiredPermissions.some((perm) => userPerms.includes(perm));
};
