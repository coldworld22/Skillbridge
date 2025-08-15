const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export function safeEncodeURI(url) {
  return encodeURI(url).replace(/#/g, "%23");
}

export function buildUrl(path) {
  if (!path) return null;
  if (/^https?:/i.test(path)) return path;
  const uploadsIndex = path.indexOf("/uploads");
  const relative = uploadsIndex !== -1 ? path.substring(uploadsIndex) : path;
  const normalized = relative.startsWith("/") ? relative : `/${relative}`;
  return `${API_BASE}${normalized}`;
}
