const parseIncludedPlanIds = (input) => {
  if (Array.isArray(input)) {
    return input
      .map((value) => {
        if (value === null || value === undefined) return null;
        const trimmed = `${value}`.trim();
        return trimmed.length ? trimmed : null;
      })
      .filter(Boolean);
  }

  if (input === null || input === undefined) return [];

  if (typeof input === "string") {
    const trimmed = input.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      return parseIncludedPlanIds(parsed);
    } catch {
      return [trimmed];
    }
  }

  if (typeof input === "object") {
    if (Array.isArray(input)) return parseIncludedPlanIds(input);
    return [];
  }

  return [`${input}`];
};

const groupContentByPlan = (items = [], mapFn = (item) => item) => {
  const grouped = {};

  items.forEach((item) => {
    const planIds = parseIncludedPlanIds(item?.included_plans);
    if (!planIds.length) return;

    planIds.forEach((planIdRaw) => {
      const planId = `${planIdRaw}`;
      if (!planId) return;
      if (!grouped[planId]) grouped[planId] = [];

      const mapped = mapFn(item) || {};
      grouped[planId].push(mapped);
    });
  });

  Object.keys(grouped).forEach((planId) => {
    grouped[planId] = grouped[planId].sort((a, b) => {
      const titleA = `${a.title || ""}`.toLowerCase();
      const titleB = `${b.title || ""}`.toLowerCase();
      if (titleA < titleB) return -1;
      if (titleA > titleB) return 1;
      return 0;
    });
  });

  return grouped;
};

module.exports = {
  parseIncludedPlanIds,
  groupContentByPlan,
};
