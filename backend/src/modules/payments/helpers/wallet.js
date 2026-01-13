const db = require("../../../config/database");
const walletService = require("../../payouts/wallet.service");
const logger = require("../../../utils/logger.js");
const { calculateInstructorAmount } = require("./planRevenue");

const fetchInstructorContext = async (item_type, item_id, trx = db) => {
  const query = trx;
  if (item_type === "book") {
    return query("books")
      .where({ id: item_id })
      .first(["instructor_id", "tenant_id"]);
  }
  if (item_type === "class") {
    return query("online_classes")
      .where({ id: item_id })
      .first(["instructor_id", "tenant_id"]);
  }
  if (item_type === "tutorial") {
    return query("tutorials")
      .where({ id: item_id })
      .first(["instructor_id", "tenant_id"]);
  }
  return null;
};

async function creditInstructorWallet(item_type, item_id, amount, tenantId = null) {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount < 0) return;
  try {
    const context = await fetchInstructorContext(item_type, item_id);
    if (context?.instructor_id) {
      const targetTenantId = tenantId || context.tenant_id;
      await walletService.increment(
        context.instructor_id,
        numericAmount,
        null,
        targetTenantId,
      );
    }
  } catch (err) {
    logger.error("Failed to credit instructor wallet:", err);
  }
}

async function creditInstructorSubscription(
  item_type,
  item_id,
  planId,
  subscriptionIdOrTrx,
  maybeTrx
) {
  if (!planId) return;
  let subscriptionId = null;
  let trx = maybeTrx;

  const looksLikeTrx =
    subscriptionIdOrTrx === null ||
    subscriptionIdOrTrx === undefined ||
    typeof subscriptionIdOrTrx === "object" ||
    typeof subscriptionIdOrTrx === "function";

  if (arguments.length >= 5) {
    subscriptionId = subscriptionIdOrTrx;
  } else if (!looksLikeTrx) {
    subscriptionId = subscriptionIdOrTrx;
    trx = undefined;
  } else {
    trx = subscriptionIdOrTrx;
  }

  try {
    const args = [planId, item_id, trx, item_type];
    if (subscriptionId) {
      args.push(subscriptionId);
    }
    const amount = await calculateInstructorAmount(...args);
    if (amount <= 0) return;

    let instructorId;
    let tenantId;
    const record = await fetchInstructorContext(item_type, item_id, trx || db);
    instructorId = record?.instructor_id;
    tenantId = record?.tenant_id;

    if (instructorId) {
      await walletService.increment(instructorId, amount, trx, tenantId);
    }
  } catch (err) {
    logger.error("Failed to credit instructor wallet from subscription:", err);
  }
}

async function creditTutorialSubscription(
  tutorialId,
  planId,
  subscriptionIdOrTrx,
  maybeTrx
) {
  if (!planId) return;
  let subscriptionId = null;
  let trx = maybeTrx;

  const looksLikeTrx =
    subscriptionIdOrTrx === null ||
    subscriptionIdOrTrx === undefined ||
    typeof subscriptionIdOrTrx === "object" ||
    typeof subscriptionIdOrTrx === "function";

  if (arguments.length === 4) {
    subscriptionId = subscriptionIdOrTrx;
    trx = maybeTrx;
  } else if (!looksLikeTrx) {
    subscriptionId = subscriptionIdOrTrx;
    trx = undefined;
  } else {
    trx = subscriptionIdOrTrx;
  }

  try {
    const args = [planId, tutorialId, trx, "tutorial"];
    if (subscriptionId) {
      args.push(subscriptionId);
    }
    const amount = await calculateInstructorAmount(...args);
    if (amount <= 0) return;
    const tut = await fetchInstructorContext("tutorial", tutorialId, trx || db);
    if (tut?.instructor_id) {
      await walletService.increment(
        tut.instructor_id,
        amount,
        trx,
        tut?.tenant_id,
      );
    }
  } catch (err) {
    logger.error(
      "Failed to credit instructor wallet from tutorial subscription:",
      err,
    );
  }
}

async function creditInstructorFromPayment(payment, tenantId = null) {
  if (!payment) return;
  const amount = Number(payment.instructor_amount);
  if (!Number.isFinite(amount) || amount <= 0) return;
  await creditInstructorWallet(
    payment.item_type,
    payment.item_id,
    amount,
    tenantId || payment?.tenant_id,
  );
}

module.exports = {
  creditInstructorWallet,
  creditInstructorSubscription,
  creditTutorialSubscription,
  creditInstructorFromPayment,
};
