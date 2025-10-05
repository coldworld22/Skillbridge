const db = require("../../../config/database");
const paymentsService = require("../payments.service");

const METHOD_TYPE_PRIORITY = [
  "plan_subscription",
  "subscription",
  "plan",
  "free",
];

const NAME_HINTS = ["subscription", "plan", "free"];

const normalize = (value) => (value ? value.toLowerCase() : "");

async function resolvePlanPaymentMethod(trx) {
  const connection = trx || db;

  try {
    const rows = await connection("payment_methods_config")
      .select("id", "type", "name", "is_default", "created_at")
      .orderBy("is_default", "desc")
      .orderBy("created_at", "asc");

    const normalizedRows = rows.map((row) => ({
      ...row,
      type: normalize(row.type),
      name: normalize(row.name),
    }));

    const byType = normalizedRows.find((row) =>
      METHOD_TYPE_PRIORITY.includes(row.type)
    );
    if (byType) {
      return byType.id;
    }

    const byName = normalizedRows.find((row) =>
      NAME_HINTS.some((hint) => row.name.includes(hint))
    );
    return byName ? byName.id : null;
  } catch (err) {
    return null;
  }
}

async function recordPlanCoveredPayment({
  trx,
  userId,
  itemId,
  itemType,
  source = "subscription",
  amount = 0,
  currency = "USD",
  methodId: explicitMethodId,
}) {
  const methodId =
    explicitMethodId === undefined
      ? await resolvePlanPaymentMethod(trx)
      : explicitMethodId;

  const data = {
    user_id: userId,
    item_id: itemId,
    item_type: itemType,
    amount,
    currency,
    status: paymentsService.STATUS.PAID,
    source,
    paid_at: new Date(),
    method_id: methodId ?? null,
  };

  return paymentsService.create(data, [], trx);
}

module.exports = {
  resolvePlanPaymentMethod,
  recordPlanCoveredPayment,
};
