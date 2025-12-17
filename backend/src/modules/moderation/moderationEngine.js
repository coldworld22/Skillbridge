const ruleset = require("./moderationRules");

const SEVERITY_WEIGHT = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

const foldDiacritics = (input = "") =>
  input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const collapseWhitespace = (input = "") =>
  input.replace(/\s+/g, " ").trim();

const toCanonical = (input = "") =>
  collapseWhitespace(foldDiacritics(input).toLowerCase());

const ensureGlobal = (pattern) => {
  if (pattern.flags.includes("g")) return pattern;
  return new RegExp(pattern.source, `${pattern.flags}g`);
};

const dedupeMatches = (matches) => {
  const seen = new Set();
  return matches.filter((match) => {
    const key = `${match.ruleId}:${match.term}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const calculateScore = (matches) =>
  matches.reduce(
    (score, match) => score + (SEVERITY_WEIGHT[match.severity] || 0),
    0
  );

const deriveSeverity = (matches) => {
  let severity = null;
  for (const match of matches) {
    if (
      !severity ||
      (SEVERITY_WEIGHT[match.severity] || 0) > (SEVERITY_WEIGHT[severity] || 0)
    ) {
      severity = match.severity;
    }
  }
  return severity;
};

const analyzeText = (text, { rules = ruleset } = {}) => {
  const raw = text ?? "";
  const flattened = foldDiacritics(raw);
  const canonical = toCanonical(raw);
  const matches = [];

  if (!canonical) {
    return {
      flagged: false,
      matches: [],
      heuristics: [],
      severity: null,
      score: 0,
      reason: null,
      autopilot: {
        shouldBlock: false,
        shouldSoftBlock: false,
        shouldNotify: false,
      },
      canonical,
    };
  }

  for (const rule of rules) {
    for (const pattern of rule.patterns) {
      const regex = ensureGlobal(pattern);
      let execResult;
      while ((execResult = regex.exec(canonical)) !== null) {
        const term = collapseWhitespace(execResult[0] || "");
        if (!term) continue;
        matches.push({
          ruleId: rule.id,
          label: rule.label,
          severity: rule.severity,
          term,
          index: execResult.index,
        });
      }
    }
  }

  const uniqueMatches = dedupeMatches(matches);
  const severity = deriveSeverity(uniqueMatches);
  const score = calculateScore(uniqueMatches);

  const heuristics = [];
  const strippedAlpha = flattened.replace(/[^A-Za-z]/g, "");
  if (strippedAlpha.length >= 6) {
    const uppercaseRatio =
      strippedAlpha.split("").filter((ch) => ch === ch.toUpperCase()).length /
      strippedAlpha.length;
    if (uppercaseRatio >= 0.75) {
      heuristics.push({
        type: "shouting",
        severity: "low",
        detail: "High uppercase ratio",
      });
    }
  }

  const flagged = uniqueMatches.length > 0;
  const reason = flagged
    ? uniqueMatches
        .map(
          (match) =>
            `${match.label}${match.term ? ` («${match.term}»)` : ""}`
        )
        .join("; ")
    : null;

  const autopilot = {
    shouldBlock: (SEVERITY_WEIGHT[severity] || 0) >= SEVERITY_WEIGHT.critical,
    shouldSoftBlock: (SEVERITY_WEIGHT[severity] || 0) >= SEVERITY_WEIGHT.high,
    shouldNotify: flagged || heuristics.length > 0,
  };

  return {
    flagged,
    matches: uniqueMatches,
    heuristics,
    severity,
    score,
    reason,
    autopilot,
    canonical,
    raw,
  };
};

module.exports = {
  analyzeText,
  ruleset,
  severityWeight: SEVERITY_WEIGHT,
};
