const db = require("../../config/database");

const clientName = db?.client?.config?.client;
const isSqlite = clientName === "sqlite3";

exports.create = async (data) => {
  if (isSqlite) {
    const [id] = await db("faqs").insert(data);
    const row = await db("faqs").where({ id }).first();
    return row;
  }

  const [row] = await db("faqs").insert(data).returning("*");
  return row;
};

exports.list = () => {
  return db("faqs").select("*").orderBy("created_at", "desc");
};

exports.getById = (id) => {
  return db("faqs").where({ id }).first();
};

exports.update = async (id, data) => {
  if (isSqlite) {
    const updated = await db("faqs")
      .where({ id })
      .update({ ...data, updated_at: db.fn.now() });

    if (!updated) return null;

    const row = await db("faqs").where({ id }).first();
    return row;
  }

  const [row] = await db("faqs")
    .where({ id })
    .update({ ...data, updated_at: db.fn.now() })
    .returning("*");
  return row;
};

exports.remove = (id) => db("faqs").where({ id }).del();
