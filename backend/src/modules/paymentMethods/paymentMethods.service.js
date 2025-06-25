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
