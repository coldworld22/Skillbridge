export const toSocialLinksArray = (links = {}) =>
  Object.entries(links || {}).reduce((acc, [platform, url]) => {
    if (url === null || url === undefined) {
      return acc;
    }

    let normalizedUrl = url;

    if (typeof normalizedUrl !== "string") {
      normalizedUrl = String(normalizedUrl);
    }

    if (typeof normalizedUrl === "string") {
      const trimmed = normalizedUrl.trim();

      if (trimmed !== "") {
        acc.push({ platform, url: trimmed });
      }
    }

    return acc;
  }, []);
