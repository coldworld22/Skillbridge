const knex = require("../../../config/database");
const AppError = require("../../../utils/AppError");

const resolveClient = (trx) => {
  if (trx && typeof trx === "function") {
    return trx;
  }
  return knex;
};

const TABLE_NAME = "payment_methods_config";

async function getPlanCoveredMethod(trx) {
  const client = resolveClient(trx);

  const subscriptionMethod = await client(TABLE_NAME)
    .where({ type: "subscription" })
    .first();

  if (subscriptionMethod) {
    return subscriptionMethod;
  }

  const freeMethod = await client(TABLE_NAME)
    .where({ type: "free" })
    .first();

  if (freeMethod) {
    return freeMethod;
  }

  throw new AppError("Subscription payment method not configured", 500);
}

module.exports = { getPlanCoveredMethod };
