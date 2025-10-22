const db = require("../../config/database");
const AppError = require("../../utils/AppError");
const logger = require("../../utils/logger");
const { isUndefinedTableError, logUndefinedTableWarning } = require("../../utils/dbErrors");

const DUPLICATE_ERROR_CODE = "23505";
const CONNECTION_ERROR_MESSAGE =
  "Unable to access the language catalog. Please try again after the database connection is restored.";

const GENERIC_ERROR_MESSAGE =
  "Unable to access the language catalog. Please try again after the database connection is restored.";

const parseDbError = (err, context) => {
  if (err?.code === DUPLICATE_ERROR_CODE) {
    throw new AppError("Duplicate language code", 409);
  }
  logger.error(`[languages] ${context}`, err);
  if (err instanceof AppError) throw err;
  throw new AppError(CONNECTION_ERROR_MESSAGE, 503);
};

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
    parseDbError(err, "Failed to create language");
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
    parseDbError(error, "Failed to list languages");
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
    parseDbError(error, "Failed to fetch language");
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
    parseDbError(err, "Failed to update language");
  }
};

exports.remove = async (id) => {
  try {
    return await db("languages").where({ id }).del();
  } catch (err) {
    parseDbError(err, "Failed to delete language");
  }
};
