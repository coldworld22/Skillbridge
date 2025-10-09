const db = require("../../config/database");
const AppError = require("../../utils/AppError");
const logger = require("../../utils/logger.js");

const databaseUnavailableError = () =>
  new AppError(
    "Unable to access the language catalog. Please try again after the database connection is restored.",
    503
  );

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
  } catch (err) {
    logger.error("[languages] Failed to list languages", err);
    throw databaseUnavailableError();
  }
};

exports.getById = async (id) => {
  try {
    return await db("languages").where({ id }).first();
  } catch (err) {
    logger.error("[languages] Failed to load language", err);
    throw databaseUnavailableError();
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
