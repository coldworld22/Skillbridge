export const toSocialLinksArray = (links = {}) =>
  Object.entries(links || {}).reduce((acc, [platform, url]) => {
    if (url === null || url === undefined) {
      return acc;
    }

    if (typeof url !== "string") {
      return acc;
    }

    const trimmed = url.trim();

    if (trimmed !== "") {
      acc.push({ platform, url: trimmed });
    }

    return acc;
  }, []);
