export const getCookie = (name) => {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie ? document.cookie.split('; ') : [];
  for (let i = 0; i < cookies.length; i++) {
    const [rawKey, ...rawVal] = cookies[i].split('=');
    const key = decodeURIComponent(rawKey);
    if (key === name) {
      return decodeURIComponent(rawVal.join('='));
    }
  }
  return null;
};
