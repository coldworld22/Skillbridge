const normalizePlanId = (value) => {
  if (value == null) return null;
  const str = String(value).trim();
  return str ? str : null;
};

const parseIncludedPlanRefs = (raw) => {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((value) => normalizePlanId(value))
      .filter(Boolean);
  }

  if (typeof raw === "object") {
    return parseIncludedPlanRefs(raw.value ?? raw.plan_id ?? raw.planId ?? raw.id ?? []);
  }

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      return parseIncludedPlanRefs(parsed);
    } catch {
      return [trimmed];
    }
  }

  return [String(raw)];
};

const buildPlanIdLookup = (plans = []) => {
  const lookup = new Map();
  plans.forEach((plan) => {
    const id = normalizePlanId(plan?.id);
    if (!id) return;
    lookup.set(id, id);
    const slug = normalizePlanId(plan?.slug);
    if (slug) lookup.set(slug, id);
  });
  return lookup;
};

const collectCoverageByPlan = (items = [], lookup, format) => {
  if (!(lookup instanceof Map)) lookup = buildPlanIdLookup();
  const formatter = typeof format === "function" ? format : (value) => value;
  const grouped = {};

  items.forEach((item) => {
    const planRefs = parseIncludedPlanRefs(item?.included_plans);
    if (!planRefs.length) return;

    planRefs.forEach((ref) => {
      const key = lookup.get(ref) ?? lookup.get(normalizePlanId(ref));
      if (!key) return;
      const entry = formatter(item);
      if (!entry) return;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(entry);
    });
  });

  return grouped;
};

module.exports = {
  normalizePlanId,
  parseIncludedPlanRefs,
  buildPlanIdLookup,
  collectCoverageByPlan,
};
