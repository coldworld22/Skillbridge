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

exports.getPayPalSettings = async () => {
  const row = await exports.getByType("paypal");
  const settings = parseSettings(row?.settings);
  return {
    client_id,
    client_secret,
    mode: normalizePayPalMode(settings.mode, process.env.PAYPAL_MODE),
  };
};

exports.updatePayPalSettings = async (settings) => {
  const row = await exports.getByType("paypal");
  if (!row) throw new Error("PayPal method not found");
  const newSettings = { ...parseSettings(row.settings), ...settings };
  const [updated] = await db("payment_methods_config")
    .where({ id: row.id })
    .update({ settings: payload })
    .returning("settings");
  if (typeof updated === "string") {
    try {
      return JSON.parse(updated);
    } catch (err) {
      return newSettings;
    }
  }
  return updated || newSettings;
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
