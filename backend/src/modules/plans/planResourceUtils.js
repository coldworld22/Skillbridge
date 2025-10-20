const parseIncludedPlanIds = (value) => {
  if (value === null || value === undefined) return [];

  let data = value;
  if (typeof data === "string") {
    const trimmed = data.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      data = parsed;
    } catch {
      return [trimmed];
    }
  }

  if (!Array.isArray(data)) {
    data = [data];
  }

  const ids = [];
  data.forEach((entry) => {
    if (entry === null || entry === undefined) return;
    if (typeof entry === "object") {
      const candidate =
        entry.plan_id ?? entry.planId ?? entry.id ?? entry.value ?? null;
      if (candidate !== null && candidate !== undefined) {
        const str = String(candidate).trim();
        if (str) ids.push(str);
      }
      return;
    }
    const str = String(entry).trim();
    if (str) ids.push(str);
  });

  return Array.from(new Set(ids));
};

const groupResourcesByPlan = (items = [], mapItem = (item) => item) => {
  const grouped = {};
  items.forEach((item) => {
    const planIds = parseIncludedPlanIds(item?.included_plans);
    if (!planIds.length) return;
    const mapped = mapItem(item);
    if (!mapped) return;
    planIds.forEach((planId) => {
      if (!grouped[planId]) grouped[planId] = [];
      grouped[planId].push(mapped);
    });
  });
  return grouped;
};

module.exports = {
  parseIncludedPlanIds,
  groupResourcesByPlan,
};
