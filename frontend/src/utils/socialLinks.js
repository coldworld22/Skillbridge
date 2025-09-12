export const toSocialLinksArray = (links = {}) =>
  Object.entries(links || {})
    .filter(([, url]) => url.trim() !== "")
    .map(([platform, url]) => ({ platform, url }));
