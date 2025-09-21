export const toSocialLinksArray = (links = {}) =>
  Object.entries(links || {}).reduce((acc, [platform, url]) => {
    if (url === null || url === undefined) {
      return acc;
    }

    const normalizedUrl = typeof url === "string" ? url : "";
    const trimmed = normalizedUrl.trim();

    if (trimmed !== "") {
      acc.push({ platform, url: trimmed });
    }

    return acc;
  }, []);
