export function getTokenExpiration(token) {
  try {
    const payloadPart = token.split('.')[1];
    const decoded = JSON.parse(atob(payloadPart));
    return typeof decoded.exp === 'number' ? decoded.exp * 1000 : null;
  } catch (_err) {
    return null;
  }
}

export function isTokenExpired(token) {
  const exp = getTokenExpiration(token);
  if (!exp) return true;
  return Date.now() >= exp;
}
