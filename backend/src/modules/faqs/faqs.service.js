const db = require("../../config/database");

exports.create = async (data) => {
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
  const [row] = await db("faqs")
    .where({ id })
    .update({ ...data, updated_at: db.fn.now() })
    .returning("*");
  return row;
};

exports.remove = (id) => db("faqs").where({ id }).del();
