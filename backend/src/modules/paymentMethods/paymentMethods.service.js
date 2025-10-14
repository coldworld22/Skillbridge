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
  const normalized = `${type ?? ""}`.trim();
  if (!normalized) return null;
  const lower = normalized.toLowerCase();

  const byType = await db("payment_methods_config")
    .whereRaw("LOWER(type) = ?", lower)
    .first();
  if (byType) return byType;

  const byName = await db("payment_methods_config")
    .whereRaw("LOWER(name) = ?", lower)
    .first();

  return byName || null;
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

exports.getPayPalSettings = async () => {
  const row = await exports.getByType("paypal");
  const settings = row?.settings || {};
  return {
    client_id: settings.client_id || process.env.PAYPAL_CLIENT_ID,
    client_secret: settings.client_secret || process.env.PAYPAL_CLIENT_SECRET,
    mode: settings.mode || process.env.PAYPAL_MODE || "sandbox",
  };
};

exports.updatePayPalSettings = async (settings) => {
  const row = await exports.getByType("paypal");
  if (!row) throw new Error("PayPal method not found");
  const newSettings = { ...(row.settings || {}), ...settings };
  const [updated] = await db("payment_methods_config")
    .where({ id: row.id })
    .update({ settings: newSettings })
    .returning("settings");
  return updated;
};

exports.getPayPalClientId = async () => {
  const settings = await exports.getPayPalSettings();
  return settings.client_id || null;
};

exports.getStripeSettings = async () => {
  const row = await exports.getByType("stripe");
  const settings = row?.settings || {};
  return {
    publishable_key:
      settings.publishable_key || process.env.STRIPE_PUBLISHABLE_KEY,
    secret_key: settings.secret_key || process.env.STRIPE_SECRET_KEY,
  };
};

exports.updateStripeSettings = async (settings) => {
  const row = await exports.getByType("stripe");
  if (!row) throw new Error("Stripe method not found");
  const newSettings = { ...(row.settings || {}), ...settings };
  const [updated] = await db("payment_methods_config")
    .where({ id: row.id })
    .update({ settings: newSettings })
    .returning("settings");
  return updated;
};

exports.getCoinbaseSettings = async () => {
  const row = await exports.getByType("coinbase");
  const settings = row?.settings || {};
  return {
    api_key: settings.api_key || process.env.COINBASE_API_KEY,
    api_secret: settings.api_secret || process.env.COINBASE_API_SECRET,
  };
};

exports.updateCoinbaseSettings = async (settings) => {
  const row = await exports.getByType("coinbase");
  if (!row) throw new Error("Coinbase method not found");
  const newSettings = { ...(row.settings || {}), ...settings };
  const [updated] = await db("payment_methods_config")
    .where({ id: row.id })
    .update({ settings: newSettings })
    .returning("settings");
  return updated;
};
