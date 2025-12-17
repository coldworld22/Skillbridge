const db = require("../../config/database");

exports.create = async (data) => {
  const [row] = await db("book_categories").insert(data).returning("*");
  return row;
};

exports.list = () => {
  return db("book_categories").select("*").orderBy("created_at", "desc");
};

exports.getById = (id) => {
  return db("book_categories").where({ id }).first();
};

exports.update = async (id, data) => {
  const [row] = await db("book_categories").where({ id }).update(data).returning("*");
  return row;
};

exports.remove = (id) => db("book_categories").where({ id }).del();
