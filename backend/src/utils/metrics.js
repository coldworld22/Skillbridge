const counters = new Map();
const histograms = new Map();

const normalizeLabels = (labels = {}) => {
  return Object.entries(labels)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => [key, String(value)])
    .sort(([a], [b]) => a.localeCompare(b));
};

const buildKey = (name, labels) => {
  const normalized = normalizeLabels(labels);
  if (!normalized.length) return name;
  const suffix = normalized.map(([key, value]) => `${key}=${value}`).join(",");
  return `${name}|${suffix}`;
};

const increment = (name, labels = {}) => {
  const key = buildKey(name, labels);
  const existing = counters.get(key) || {
    name,
    labels: Object.fromEntries(normalizeLabels(labels)),
    value: 0,
  };
  existing.value += 1;
  counters.set(key, existing);
  return existing.value;
};

const observeDuration = (name, durationMs, labels = {}) => {
  const key = buildKey(name, labels);
  const existing = histograms.get(key) || {
    name,
    labels: Object.fromEntries(normalizeLabels(labels)),
    count: 0,
    totalMs: 0,
    minMs: null,
    maxMs: null,
  };
  const value = Number(durationMs);
  if (!Number.isFinite(value)) {
    return existing;
  }
  existing.count += 1;
  existing.totalMs += value;
  existing.minMs = existing.minMs === null ? value : Math.min(existing.minMs, value);
  existing.maxMs = existing.maxMs === null ? value : Math.max(existing.maxMs, value);
  histograms.set(key, existing);
  return existing;
};

const snapshot = () => {
  const countersSnapshot = Array.from(counters.values()).map((entry) => ({
    name: entry.name,
    labels: entry.labels,
    value: entry.value,
  }));
  const histogramsSnapshot = Array.from(histograms.values()).map((entry) => ({
    name: entry.name,
    labels: entry.labels,
    count: entry.count,
    totalMs: entry.totalMs,
    avgMs: entry.count ? entry.totalMs / entry.count : 0,
    minMs: entry.minMs ?? 0,
    maxMs: entry.maxMs ?? 0,
  }));
  return { counters: countersSnapshot, histograms: histogramsSnapshot };
};

module.exports = {
  increment,
  observeDuration,
  snapshot,
};
