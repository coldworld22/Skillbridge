import api from "@/services/api/api";

/**
 * Fetch global application configuration.
 */
export const getAppConfig = async () => {
  // Use the shared API instance so cookies (CSRF, session, etc.) are sent
  // consistently for all users, ensuring the hero background loads for every
  // role.
  const { data } = await api.get("app-config");
  return data?.data ?? data ?? {};
};
