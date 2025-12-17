const db = require("../../config/database");

exports.create = async (data) => {
  const [row] = await db("payouts").insert(data).returning("*");
  return row;
};

exports.getAll = async () => {
  return db({ p: "payouts" })
    .leftJoin("users as u", "p.instructor_id", "u.id")
    .select(
      "p.*",
      "u.full_name as instructor_name",
      "u.email as instructor_email"
    )
    .orderBy("p.requested_at", "desc");
};

exports.getByInstructor = async (instructor_id) => {
  return db("payouts")
    .where({ instructor_id })
    .select("*")
    .orderBy("requested_at", "desc");
};

exports.getById = async (id) => {
  return db("payouts").where({ id }).first();
};

exports.update = async (id, data) => {
  const [row] = await db("payouts").where({ id }).update(data).returning("*");
  return row;
};

exports.delete = async (id) => {
  return db("payouts").where({ id }).del();
};
