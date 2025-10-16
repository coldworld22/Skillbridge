const db = require("../../config/database");

exports.create = async (data) => {
  return db.transaction(async (trx) => {
    if (data.is_default) {
      await trx("payment_methods_config").update({ is_default: false });
    }
    const [row] = await trx("payment_methods_config").insert(data).returning("*");
    return row;
  });
};

exports.getAll = () => {
  return db("payment_methods_config").select("*").orderBy("id");
};

exports.getActive = () => {
  return db("payment_methods_config")
    .where({ active: true })
    .select("*")
    .orderBy("id");
};

exports.getById = (id) => {
  return db("payment_methods_config").where({ id }).first();
};

exports.getByType = async (type) => {
  if (type === undefined || type === null) return null;

  const normalized = String(type).trim().toLowerCase();
  if (!normalized) return null;

  const baseQuery = db("payment_methods_config")
    .orderBy("is_default", "desc")
    .orderBy("created_at", "asc");

  const matchByType = await baseQuery
    .clone()
    .whereRaw("LOWER(type) = ?", [normalized])
    .first();
  if (matchByType) return matchByType;

  const matchByName = await baseQuery
    .clone()
    .whereRaw("LOWER(name) = ?", [normalized])
    .first();
  if (matchByName) return matchByName;

  if (normalized.includes("bank")) {
    const bankLike = await baseQuery
      .clone()
      .whereRaw("LOWER(name) LIKE ?", ["%bank%"])
      .orWhereRaw("LOWER(type) LIKE ?", ["%bank%"])
      .first();
    if (bankLike) return bankLike;
  }

  return null;
};

exports.update = async (id, data) => {
  return db.transaction(async (trx) => {
    if (data.is_default) {
      await trx("payment_methods_config")
        .whereNot({ id })
        .update({ is_default: false });
    }
    const [row] = await trx("payment_methods_config")
      .where({ id })
      .update(data)
      .returning("*");
    return row;
  });
};

exports.delete = (id) => {
  return db("payment_methods_config").where({ id }).del();
};

function parseSettings(rawSettings) {
  if (!rawSettings) return {};
  if (typeof rawSettings === "object") return rawSettings;
  if (typeof rawSettings === "string") {
    try {
      return JSON.parse(rawSettings);
    } catch (err) {
      return {};
    }
  }
  return {};
}

const PAYPAL_CLIENT_ID_KEYS = [
  "client_id",
  "clientId",
  "CLIENT_ID",
  "paypal_client_id",
  "paypalClientId",
];

const PAYPAL_CLIENT_SECRET_KEYS = [
  "client_secret",
  "clientSecret",
  "CLIENT_SECRET",
  "paypal_client_secret",
  "paypalClientSecret",
];

const PAYPAL_MODE_KEYS = [
  "mode",
  "MODE",
  "client_mode",
  "clientMode",
  "paypal_mode",
  "paypalMode",
];

const INVALID_PAYPAL_VALUE_STRINGS = new Set(["undefined", "null", "none"]);

function trimValue(value) {
  if (value === undefined || value === null) return undefined;
  const trimmed = String(value).trim();
  if (trimmed === "") return undefined;
  if (INVALID_PAYPAL_VALUE_STRINGS.has(trimmed.toLowerCase())) return undefined;
  return trimmed;
}

function pickFirstMatching(source, keys) {
  if (!source) return undefined;
  for (const key of keys) {
    const value = trimValue(source[key]);
    if (value !== undefined) return value;
  }
  return undefined;
}

function normalizePayPalMode(...candidates) {
  for (const candidate of candidates) {
    const value = trimValue(candidate);
    if (!value) continue;
    const normalized = value.toLowerCase();
    if (normalized === "live" || normalized === "sandbox") return normalized;
  }
  return "sandbox";
}

function toCanonicalPayPalSettings(rawSettings, { fallbackToEnv = true } = {}) {
  const source = rawSettings || {};
  const env = fallbackToEnv ? process.env : {};

  const clientId =
    pickFirstMatching(source, PAYPAL_CLIENT_ID_KEYS) ||
    trimValue(env?.PAYPAL_CLIENT_ID);
  const clientSecret =
    pickFirstMatching(source, PAYPAL_CLIENT_SECRET_KEYS) ||
    trimValue(env?.PAYPAL_CLIENT_SECRET);
  const modeCandidates = PAYPAL_MODE_KEYS.map((key) => trimValue(source[key]));
  if (fallbackToEnv) {
    modeCandidates.push(trimValue(env?.PAYPAL_MODE));
  }
  const hasModeCandidate = modeCandidates.some((value) => value !== undefined);
  const mode = hasModeCandidate
    ? normalizePayPalMode(...modeCandidates)
    : fallbackToEnv
    ? "sandbox"
    : null;

  return {
    client_id: clientId || null,
    client_secret: clientSecret || null,
    mode,
  };
}

function extractProvidedPayPalSettings(rawSettings) {
  const source = rawSettings || {};
  const provided = {};

  const clientId = pickFirstMatching(source, PAYPAL_CLIENT_ID_KEYS);
  if (clientId !== undefined) provided.client_id = clientId;

  const clientSecret = pickFirstMatching(source, PAYPAL_CLIENT_SECRET_KEYS);
  if (clientSecret !== undefined) provided.client_secret = clientSecret;

  const modeCandidates = PAYPAL_MODE_KEYS.map((key) => trimValue(source[key])).filter(
    (value) => value !== undefined
  );
  if (modeCandidates.length) {
    provided.mode = normalizePayPalMode(...modeCandidates);
  }

  return provided;
}

exports.getPayPalSettings = async () => {
  const row = await exports.getByType("paypal");
  const settings = parseSettings(row?.settings);
  return toCanonicalPayPalSettings(settings);
};

exports.updatePayPalSettings = async (settings) => {
  const row = await exports.getByType("paypal");
  if (!row) throw new Error("PayPal method not found");
  const current = toCanonicalPayPalSettings(parseSettings(row.settings), {
    fallbackToEnv: false,
  });
  const updates = extractProvidedPayPalSettings(settings);
  const payload = {
    ...current,
    ...updates,
  };
  if (payload.mode !== null && payload.mode !== undefined) {
    payload.mode = normalizePayPalMode(payload.mode);
  }
  const serializedPayload = JSON.stringify(payload);
  const [updated] = await db("payment_methods_config")
    .where({ id: row.id })
    .update({ settings: serializedPayload })
    .returning("settings");
  if (typeof updated === "string") {
    try {
      return JSON.parse(updated);
    } catch (err) {
      return payload;
    }
  }
  return updated || payload;
};

exports.getPayPalClientId = async () => {
  const settings = await exports.getPayPalSettings();
  return settings.client_id || null;
};

exports.getStripeSettings = async () => {
  const row = await exports.getByType("stripe");
  const settings = parseSettings(row?.settings);
  return {
    publishable_key:
      settings.publishable_key || process.env.STRIPE_PUBLISHABLE_KEY,
    secret_key: settings.secret_key || process.env.STRIPE_SECRET_KEY,
  };
};

exports.updateStripeSettings = async (settings) => {
  const row = await exports.getByType("stripe");
  if (!row) throw new Error("Stripe method not found");
  const newSettings = { ...parseSettings(row.settings), ...settings };
  const [updated] = await db("payment_methods_config")
    .where({ id: row.id })
    .update({ settings: newSettings })
    .returning("settings");
  return updated;
};

exports.getCoinbaseSettings = async () => {
  const row = await exports.getByType("coinbase");
  const settings = parseSettings(row?.settings);
  return {
    api_key: settings.api_key || process.env.COINBASE_API_KEY,
    api_secret: settings.api_secret || process.env.COINBASE_API_SECRET,
  };
};

exports.updateCoinbaseSettings = async (settings) => {
  const row = await exports.getByType("coinbase");
  if (!row) throw new Error("Coinbase method not found");
  const newSettings = { ...parseSettings(row.settings), ...settings };
  const [updated] = await db("payment_methods_config")
    .where({ id: row.id })
    .update({ settings: newSettings })
    .returning("settings");
  return updated;
};
