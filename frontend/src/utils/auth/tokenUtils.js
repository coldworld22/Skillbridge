const decodeBase64Url = (value) => {
  if (typeof value !== "string" || value.length === 0) {
    return null;
  }

  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");

  try {
    if (typeof atob === "function") {
      return atob(padded);
    }
  } catch (error) {
    // Ignore and attempt Buffer fallback below.
  }

  if (typeof Buffer !== "undefined") {
    try {
      return Buffer.from(padded, "base64").toString("utf-8");
    } catch (_error) {
      return null;
    }
  }

  return null;
};

export function getTokenExpiration(token) {
  if (typeof token !== "string" || token.trim().length === 0) {
    return null;
  }

  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    const decoded = decodeBase64Url(parts[1]);
    if (!decoded) {
      return null;
    }

    const payload = JSON.parse(decoded);
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch (_err) {
    return null;
  }
}

export function isTokenExpired(token) {
  if (typeof token !== "string" || token.trim().length === 0) {
    return true;
  }

  const exp = getTokenExpiration(token);
  if (!exp) return true;
  return Date.now() >= exp;
}
