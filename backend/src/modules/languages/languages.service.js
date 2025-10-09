const db = require("../../config/database");
const { isUndefinedTableError, logUndefinedTableWarning } = require("../../utils/dbErrors");

exports.create = async (data) => {
  return db.transaction(async (trx) => {
    if (data.is_default) {
      await trx("languages").update({ is_default: false });
    }
    const [row] = await trx("languages").insert(data).returning("*");
    return row;
  });
};

exports.list = async () => {
  try {
    return await db("languages").select("*").orderBy("name");
  } catch (error) {
    if (isUndefinedTableError(error, "languages")) {
      logUndefinedTableWarning("languages", "languages.list");
      return [];
    }
    throw error;
  }
};

exports.getById = async (id) => {
  try {
    return await db("languages").where({ id }).first();
  } catch (error) {
    if (isUndefinedTableError(error, "languages")) {
      logUndefinedTableWarning("languages", "languages.getById");
      return null;
    }
    throw error;
  }
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
