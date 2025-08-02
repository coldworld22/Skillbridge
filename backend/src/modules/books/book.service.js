const db = require("../../config/database");

exports.createBook = async (data) => {
  const [row] = await db("books").insert(data).returning("*");
  return row;
};

exports.listBooks = () =>
  db("books")
    .where({ status: "approved" })
    .orderBy("created_at", "desc");

exports.getBookById = (id) => db("books").where({ id }).first();
