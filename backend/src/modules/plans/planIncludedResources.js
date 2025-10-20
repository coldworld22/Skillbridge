const parsePlanReferences = (raw) => {
  if (raw === null || raw === undefined) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((value) => {
        if (value === null || value === undefined) return null;
        const str = `${value}`.trim();
        return str ? str : null;
      })
      .filter(Boolean);
  }

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsePlanReferences(parsed);
      }
      if (parsed === null || parsed === undefined) {
        return [];
      }
      if (typeof parsed === "object") {
        return [];
      }
      return parsePlanReferences([parsed]);
    } catch {
      return [trimmed];
    }
  }

  return parsePlanReferences([raw]);
};

const createPlanReferenceResolver = (plans = []) => {
  const lookup = new Map();

  plans.forEach((plan) => {
    if (!plan) return;
    if (plan.id !== null && plan.id !== undefined) {
      const idStr = `${plan.id}`.trim();
      if (idStr) {
        lookup.set(idStr, idStr);
        lookup.set(idStr.toLowerCase(), idStr);
      }
    }
    if (plan.slug) {
      const slug = `${plan.slug}`.trim();
      if (slug) {
        const planId = plan.id !== null && plan.id !== undefined ? `${plan.id}`.trim() : null;
        const value = planId || slug;
        lookup.set(slug, value);
        lookup.set(slug.toLowerCase(), value);
      }
    }
  });

  return (reference) => {
    if (reference === null || reference === undefined) return null;
    const key = `${reference}`.trim();
    if (!key) return null;
    if (lookup.has(key)) return lookup.get(key);
    const lower = key.toLowerCase();
    if (lookup.has(lower)) return lookup.get(lower);
    return null;
  };
};

const groupItemsByPlan = (items = [], pickItem = (item) => item, resolvePlanId = () => null) => {
  if (typeof pickItem !== "function") {
    throw new TypeError("pickItem must be a function");
  }
  if (typeof resolvePlanId !== "function") {
    throw new TypeError("resolvePlanId must be a function");
  }

  const grouped = {};

  items.forEach((item) => {
    if (!item) return;
    const references = parsePlanReferences(item.included_plans);
    if (!references.length) return;

    const payload = pickItem(item);
    if (payload === null || payload === undefined) return;

    const planIds = Array.from(
      new Set(
        references
          .map((ref) => resolvePlanId(ref))
          .filter((id) => id !== null && id !== undefined && `${id}`.trim() !== "")
          .map((id) => `${id}`.trim())
      )
    );

    if (!planIds.length) return;

    planIds.forEach((planId) => {
      if (!grouped[planId]) grouped[planId] = [];
      grouped[planId].push(payload);
    });
  });

  return grouped;
};

module.exports = {
  parsePlanReferences,
  createPlanReferenceResolver,
  groupItemsByPlan,
};

