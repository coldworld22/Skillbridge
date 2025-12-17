export const AD_STATUS = Object.freeze({
  RUNNING: "running",
  PAUSED: "paused",
  SCHEDULED: "scheduled",
  EXPIRED: "expired",
});

const parseDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const normalizeNow = (nowInput) => {
  if (nowInput instanceof Date) return nowInput;
  if (nowInput) {
    const candidate = new Date(nowInput);
    if (!Number.isNaN(candidate.getTime())) {
      return candidate;
    }
  }
  return new Date();
};

export const computeAdLifecycle = (ad = {}, nowInput) => {
  const now = normalizeNow(nowInput);
  const startDate = parseDate(ad.startAt ?? ad.start_at);
  const endDate = parseDate(ad.endAt ?? ad.end_at);
  const isActive =
    typeof ad.isActive === "boolean"
      ? ad.isActive
      : typeof ad.is_active === "boolean"
        ? ad.is_active
        : Boolean(ad.isActive || ad.is_active);

  const hasStarted = !startDate || startDate.getTime() <= now.getTime();
  const hasEnded = Boolean(endDate && endDate.getTime() < now.getTime());

  let status = AD_STATUS.RUNNING;
  if (!isActive) {
    status = hasEnded ? AD_STATUS.EXPIRED : AD_STATUS.PAUSED;
  } else if (hasEnded) {
    status = AD_STATUS.EXPIRED;
  } else if (!hasStarted) {
    status = AD_STATUS.SCHEDULED;
  }

  return {
    status,
    isRunning: status === AD_STATUS.RUNNING,
    isActive,
    hasStarted,
    hasEnded,
    startDate: startDate ? startDate.toISOString() : null,
    endDate: endDate ? endDate.toISOString() : null,
  };
};

export const ensureAdLifecycle = (ad, nowInput) => {
  if (!ad) return ad;
  if (ad.lifecycle && ad.lifecycle.status && !nowInput) {
    return ad;
  }
  const lifecycle = computeAdLifecycle(ad, nowInput);
  return { ...ad, lifecycle };
};

export const ensureAdListLifecycles = (ads = [], nowInput) =>
  ads.map((ad) => ensureAdLifecycle(ad, nowInput));

export const summarizeAdLifecycles = (ads = []) => {
  const summary = {
    counts: {
      [AD_STATUS.RUNNING]: 0,
      [AD_STATUS.PAUSED]: 0,
      [AD_STATUS.SCHEDULED]: 0,
      [AD_STATUS.EXPIRED]: 0,
    },
    attention: {
      [AD_STATUS.EXPIRED]: [],
      [AD_STATUS.PAUSED]: [],
    },
  };

  ads.forEach((ad) => {
    const enriched = ensureAdLifecycle(ad);
    const status = enriched.lifecycle?.status || AD_STATUS.RUNNING;
    if (summary.counts[status] !== undefined) {
      summary.counts[status] += 1;
    }
    if (summary.attention[status]) {
      summary.attention[status].push({
        id: ad.id,
        title: ad.title,
      });
    }
  });

  summary.hasAlerts =
    summary.attention[AD_STATUS.EXPIRED].length > 0 ||
    summary.attention[AD_STATUS.PAUSED].length > 0;

  return summary;
};
