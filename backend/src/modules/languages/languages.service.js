const db = require("../../config/database");
const { isUndefinedTableError, logUndefinedTableWarning } = require("../../utils/dbErrors");

exports.create = async (data) => {
  try {
    return await db.transaction(async (trx) => {
      if (data.is_default) {
        await trx("languages").update({ is_default: false });
      }
      const [row] = await trx("languages").insert(data).returning("*");
      return row;
    });
  } catch (err) {
    logger.error("[languages] Failed to create language", err);
    throw databaseUnavailableError();
  }
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
  try {
    return await db.transaction(async (trx) => {
      if (data.is_default) {
        await trx("languages").update({ is_default: false });
      }
      const [row] = await trx("languages").where({ id }).update(data).returning("*");
      return row;
    });
  } catch (err) {
    logger.error("[languages] Failed to update language", err);
    throw databaseUnavailableError();
  }
};

exports.remove = async (id) => {
  try {
    return await db("languages").where({ id }).del();
  } catch (err) {
    logger.error("[languages] Failed to delete language", err);
    throw databaseUnavailableError();
  }
};
