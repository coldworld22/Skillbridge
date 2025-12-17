const db = require("../../config/database");

const serializeIncludedPlans = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return JSON.stringify([]);
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return JSON.stringify(value);
  try {
    return JSON.stringify(JSON.parse(value));
  } catch {
    return JSON.stringify([value]);
  }
};

const prepareClassRecord = (data = {}) => {
  if (!data || typeof data !== "object") return data;
  const payload = { ...data };
  if (payload.included_plans !== undefined) {
    payload.included_plans = serializeIncludedPlans(payload.included_plans);
  }
  return payload;
};

module.exports = {
  async create(data) {
    const payload = prepareClassRecord(data);
    const [row] = await db("online_classes").insert(payload).returning("*");
    return row;
  },

  async findById(id) {
    return db("online_classes").where({ id }).first();
  },

  async update(id, data) {
    const payload = prepareClassRecord(data);
    const [row] = await db("online_classes").where({ id }).update(payload).returning("*");
    return row;
  },

  async remove(id) {
    return db("online_classes").where({ id }).del();
  },
};
