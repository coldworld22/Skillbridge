export const getCsrfToken = () => {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split('; csrfToken=');
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};
