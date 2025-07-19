const db = require("../../config/database");

exports.create = async (data) => {
  return db.transaction(async (trx) => {
    if (data.is_default) {
      await trx("languages").update({ is_default: false });
    }
    const [row] = await trx("languages").insert(data).returning("*");
    return row;
  });
};

exports.list = () => {
  return db("languages").select("*").orderBy("name");
};

exports.update = async (id, data) => {
  return db.transaction(async (trx) => {
    if (data.is_default) {
      await trx("languages").update({ is_default: false });
    }
    const [row] = await trx("languages").where({ id }).update(data).returning("*");
    return row;
  });
};

exports.remove = (id) => db("languages").where({ id }).del();
