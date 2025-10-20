const humanizeKey = (key = "") =>
  key
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const FEATURE_METADATA = {
  commission_rate: {
    module: "commerce",
    label: "Platform commission",
    type: "percent",
    template: "Platform keeps {value} of each sale",
    description: (_raw, percentText) =>
      `SkillBridge retains ${percentText} from each transaction to cover processing and platform costs.`,
  },
  groups_create: {
    module: "community",
    label: "Group creation",
    type: "boolean",
    trueLabel: "Create and manage groups",
    falseLabel: "Join groups as a member only",
  },
  groups_join_limit: {
    module: "community",
    label: "Group membership limit",
    type: "count",
    singular: "Join up to {count} group",
    plural: "Join up to {count} groups",
    unlimited: "Join unlimited groups",
  },
  classes_create: {
    module: "classes",
    label: "Class publishing",
    type: "boolean",
    trueLabel: "Publish online classes",
    falseLabel: "Enroll only (no class publishing)",
  },
  tutorials_create: {
    module: "tutorials",
    label: "Tutorial publishing",
    type: "boolean",
    trueLabel: "Create tutorials with chapters",
    falseLabel: "View tutorials only",
  },
  tutorials_max_count: {
    module: "tutorials",
    label: "Tutorial publishing limit",
    type: "count",
    singular: "Publish up to {count} tutorial",
    plural: "Publish up to {count} tutorials",
    unlimited: "Unlimited published tutorials",
  },
  books_download: {
    module: "library",
    label: "Book downloads",
    type: "boolean",
    trueLabel: "Download purchased books",
    falseLabel: "Read-only access to library",
  },
  community_post: {
    module: "community",
    label: "Community participation",
    type: "boolean",
    trueLabel: "Post and reply in discussions",
    falseLabel: "Read-only community access",
  },
  ads_max_ads: {
    module: "ads",
    label: "Active ad slots",
    type: "count",
    singular: "Run {count} active ad at a time",
    plural: "Run up to {count} active ads",
    unlimited: "Run unlimited active ads",
    zero: "No active ads",
  },
  ads_max_duration: {
    module: "ads",
    label: "Ad duration",
    type: "duration",
    unit: "day",
    pluralUnit: "days",
    template: "Run ads up to {count} {unit}",
    unlimited: "No ad duration limit",
  },
  ads_allow_branding: {
    module: "ads",
    label: "Custom branding",
    type: "boolean",
    trueLabel: "Use custom branding in ads",
    falseLabel: "Platform branding only",
  },
  ads_show_analytics: {
    module: "ads",
    label: "Ad analytics",
    type: "boolean",
    trueLabel: "Access detailed ad analytics",
    falseLabel: "No analytics dashboard",
  },
};

const MODULE_ORDER = [
  "commerce",
  "community",
  "classes",
  "tutorials",
  "library",
  "ads",
];

const parseFeatureValue = (raw) => {
  if (raw === undefined) return null;
  if (raw === null) return null;
  if (typeof raw === "number" || typeof raw === "boolean") return raw;
  if (typeof raw === "object") return raw;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return "";
    if (trimmed.toLowerCase() === "unlimited") return "unlimited";
    try {
      return JSON.parse(trimmed);
    } catch {
      const num = Number(trimmed);
      if (!Number.isNaN(num)) return num;
      return trimmed;
    }
  }
  return raw;
};

const serializeFeatureValue = (value) => {
  if (value === undefined) return null;
  if (value === null) return "null";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
};

const formatBoolean = (value, meta) => {
  let boolValue = Boolean(value);
  if (typeof value === "string") {
    const normalized = value.toLowerCase();
    boolValue = ["true", "1", "yes"].includes(normalized);
  }
  const label = boolValue ? meta.trueLabel : meta.falseLabel;
  return {
    displayValue: label,
    description: meta.description
      ? typeof meta.description === "function"
        ? meta.description(value, label)
        : meta.description
      : label,
  };
};

const formatCount = (value, meta) => {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    (typeof value === "string" && value.toLowerCase() === "unlimited")
  ) {
    const text = meta.unlimited || meta.plural?.replace("{count}", "unlimited") || "Unlimited";
    return { displayValue: text, description: text };
  }
  const num = Number(value);
  if (!Number.isFinite(num)) {
    const text = meta.unlimited || "Unlimited";
    return { displayValue: text, description: text };
  }
  if (num === 0 && meta.zero) {
    return { displayValue: meta.zero, description: meta.zero };
  }
  const template = num === 1 ? meta.singular || meta.plural : meta.plural || meta.singular;
  if (!template) {
    const text = `${num}`;
    return { displayValue: text, description: text };
  }
  const countText = num.toLocaleString();
  const text = template.replace("{count}", countText);
  return { displayValue: text, description: text };
};

const formatPercent = (value, meta) => {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return { displayValue: "", description: "" };
  }
  const percent = num * 100;
  const formatted = percent % 1 === 0 ? percent.toFixed(0) : percent.toFixed(2);
  const percentText = `${formatted}%`;
  const text = (meta.template || "{value}").replace("{value}", percentText);
  const description = meta.description
    ? typeof meta.description === "function"
      ? meta.description(value, percentText)
      : meta.description
    : text;
  return { displayValue: text, description };
};

const formatDuration = (value, meta) => {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    (typeof value === "string" && value.toLowerCase() === "unlimited")
  ) {
    const text = meta.unlimited || "Unlimited duration";
    return { displayValue: text, description: text };
  }
  const num = Number(value);
  if (!Number.isFinite(num)) {
    const text = meta.unlimited || "Unlimited duration";
    return { displayValue: text, description: text };
  }
  const unitSingular = meta.unit || "day";
  const unitPlural = meta.pluralUnit || `${unitSingular}s`;
  const unitText = num === 1 ? unitSingular : unitPlural;
  const template = meta.template || "Up to {count} {unit}";
  const text = template
    .replace("{count}", num.toLocaleString())
    .replace("{unit}", unitText);
  const description = meta.description
    ? typeof meta.description === "function"
      ? meta.description(value, num, unitText)
      : meta.description
    : text;
  return { displayValue: text, description };
};

const getFeaturePresentation = (key, value) => {
  const meta = FEATURE_METADATA[key];
  const label = meta?.label || humanizeKey(key);
  const module = meta?.module || null;
  if (!meta) {
    const displayValue =
      value === null || value === undefined ? "" : typeof value === "string" ? value : String(value);
    return {
      label,
      module,
      displayValue,
      description: displayValue,
    };
  }

  let result;
  switch (meta.type) {
    case "boolean":
      result = formatBoolean(value, meta);
      break;
    case "count":
      result = formatCount(value, meta);
      break;
    case "percent":
      result = formatPercent(value, meta);
      break;
    case "duration":
      result = formatDuration(value, meta);
      break;
    default: {
      if (typeof meta.format === "function") {
        const formatted = meta.format(value);
        const text =
          formatted === null || formatted === undefined
            ? ""
            : typeof formatted === "string"
              ? formatted
              : String(formatted);
        const description = meta.description
          ? typeof meta.description === "function"
            ? meta.description(value, text)
            : meta.description
          : text;
        result = { displayValue: text, description };
      } else {
        const text =
          value === null || value === undefined ? "" : typeof value === "string" ? value : String(value);
        const description = meta.description
          ? typeof meta.description === "function"
            ? meta.description(value, text)
            : meta.description
          : text;
        result = { displayValue: text, description };
      }
    }
  }

  return {
    label,
    module,
    displayValue: result.displayValue,
    description: result.description,
  };
};

const SYNTHETIC_PLAN_FEATURES = [
  {
    key: "max_courses",
    roles: ["instructor"],
    module: "classes",
    label: "Active class limit",
    build: (plan) => {
      const limit = plan.max_courses;
      if (!limit) {
        const description = "Publish unlimited active classes";
        return {
          value: description,
          description,
          raw: limit,
          parsed: null,
        };
      }
      const num = Number(limit);
      const text =
        num === 1
          ? "Publish 1 active class at a time"
          : `Publish up to ${num.toLocaleString()} active classes`;
      return {
        value: text,
        description: text,
        raw: limit,
        parsed: Number.isFinite(num) ? num : limit,
      };
    },
  },
  {
    key: "ad_credits",
    roles: ["instructor"],
    module: "ads",
    label: "Ad credits per cycle",
    build: (plan) => {
      const credits = Number(plan.ad_credits ?? 0);
      let text;
      if (!credits) {
        text = "No ad credits included";
      } else if (credits === 1) {
        text = "1 ad credit per billing cycle";
      } else {
        text = `${credits.toLocaleString()} ad credits per billing cycle`;
      }
      return {
        value: text,
        description: text,
        raw: plan.ad_credits,
        parsed: credits,
      };
    },
  },
];

module.exports = {
  FEATURE_METADATA,
  MODULE_ORDER,
  SYNTHETIC_PLAN_FEATURES,
  parseFeatureValue,
  serializeFeatureValue,
  getFeaturePresentation,
};
