export const ADMIN_PERMISSIONS = Object.freeze({
  DASHBOARD: {
    VIEW: "view_admin_dashboard",
  },
  ONLINE_CLASSES: {
    VIEW: "view_online_classes",
    MANAGE: "manage_online_classes",
    RULES: "ADD_ONLINE_CLASS_RULE",
  },
  TUTORIALS: {
    VIEW: "view_tutorials",
    MANAGE: "manage_tutorials",
  },
  ASSIGNMENTS: {
    VIEW: "view_assignments",
    MANAGE: "manage_assignments",
  },
  CERTIFICATES: {
    VIEW: "view_certificates",
    MANAGE: "manage_certificates",
  },
  CATEGORIES: {
    VIEW: "view_categories",
    MANAGE: "manage_categories",
  },
  BOOKS: {
    VIEW: "view_books",
    MANAGE: "manage_books",
  },
  INSTRUCTORS: {
    VIEW: "view_instructors",
    MANAGE: "manage_instructors",
  },
  USERS: {
    VIEW: "view_users",
    MANAGE: "manage_users",
  },
  BOOKINGS: {
    VIEW: "view_bookings",
    MANAGE: "manage_bookings",
  },
  COMMUNITY: {
    VIEW: "view_community",
    MANAGE: "manage_community",
  },
  GROUPS: {
    VIEW: "view_groups",
    MANAGE: "manage_groups",
  },
  MESSAGES: {
    VIEW: "view_messages",
    MANAGE: "manage_messages",
  },
  NOTIFICATIONS: {
    VIEW: "view_notifications",
    MANAGE: "manage_notifications",
  },
  ROLES: {
    VIEW: "view_roles",
    MANAGE: "manage_roles",
  },
  PERMISSIONS: {
    VIEW: "view_permissions",
    MANAGE: "manage_permissions",
  },
  PLANS: {
    VIEW: "view_subscription_plans",
    MANAGE: "manage_subscription_plans",
  },
  PAYMENTS: {
    VIEW: "view_payment_config",
    MANAGE: "manage_payment_config",
  },
  ADS: {
    VIEW: "view_ads",
    MANAGE: "manage_ads",
  },
  OFFERS: {
    VIEW: "view_offers",
    MANAGE: "manage_offers",
  },
  COUPONS: {
    VIEW: "view_coupons",
    MANAGE: "manage_coupons",
  },
  SUPPORT: {
    VIEW: "view_support",
    MANAGE: "manage_support",
  },
  CACHE: {
    MANAGE: "manage_cache",
  },
  LANGUAGES: {
    VIEW: "view_languages",
    MANAGE: "manage_languages",
  },
  LANGUAGE_CONFIG: {
    VIEW: "view_language_config",
    MANAGE: "manage_language_config",
  },
  CURRENCIES: {
    VIEW: "view_currencies",
    MANAGE: "manage_currencies",
  },
  SOCIAL_LOGINS: {
    VIEW: "view_social_logins",
    MANAGE: "manage_social_logins",
  },
  EMAIL_CONFIG: {
    VIEW: "view_email_config",
    MANAGE: "manage_email_config",
  },
  MESSAGES_CONFIG: {
    VIEW: "view_messages_config",
    MANAGE: "manage_messages_config",
  },
  POLICIES: {
    VIEW: "view_policies",
    MANAGE: "manage_policies",
  },
  CONTACT_INFO: {
    VIEW: "view_contact_info",
    MANAGE: "manage_contact_info",
  },
  BLOGS: {
    VIEW: "view_blogs",
    MANAGE: "manage_blogs",
  },
  FAQS: {
    VIEW: "view_faqs",
    MANAGE: "manage_faqs",
  },
  APP_SETTINGS: {
    VIEW: "view_app_settings",
    MANAGE: "manage_app_settings",
  },
  FOOTER_SETTINGS: {
    VIEW: "view_footer_settings",
    MANAGE: "manage_footer_settings",
  },
  SEO_SETTINGS: {
    VIEW: "view_seo_settings",
    MANAGE: "manage_seo_settings",
  },
  POPUPS: {
    VIEW: "view_popups",
    MANAGE: "manage_popups",
  },
  CERTIFICATE_TEMPLATES: {
    VIEW: "view_certificate_templates",
    MANAGE: "manage_certificate_templates",
  },
  THIRD_PARTY_CONFIG: {
    VIEW: "view_third_party_config",
    MANAGE: "manage_third_party_config",
  },
  COMMUNITY_GROUPS: {
    VIEW: "view_groups",
    MANAGE: "manage_groups",
  },
});

export const ADMIN_PERMISSION_LIST = Object.freeze(
  Object.values(ADMIN_PERMISSIONS).flatMap((entry) => Object.values(entry))
);

