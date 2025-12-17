export const resolveApiBase = (isBrowser = typeof window !== "undefined") => {
  if (isBrowser) return "/api";
  if (process.env.INTERNAL_API_BASE_URL) return process.env.INTERNAL_API_BASE_URL;
  if (process.env.NEXT_PUBLIC_API_BASE_URL) return process.env.NEXT_PUBLIC_API_BASE_URL;
  if (process.env.APP_DOMAIN) return `https://${process.env.APP_DOMAIN}/api`;
  return "http://backend:5002/api";
};

export const resolveSiteUrl = (isBrowser = typeof window !== "undefined") => {
  if (isBrowser && typeof window !== "undefined") {
    return window.location.origin;
  }
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.APP_DOMAIN) return `https://${process.env.APP_DOMAIN}`;
  return "";
};
