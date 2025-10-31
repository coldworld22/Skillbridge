const walletService = require("../../payouts/wallet.service");
const bookService = require("../../books/book.service");
const classService = require("../../classes/class.service");
const tutorialService = require("../../users/tutorials/tutorial.service");
const logger = require("../../../utils/logger.js");
const { calculateInstructorAmount } = require("./planRevenue");

async function creditInstructorWallet(item_type, item_id, amount) {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount < 0) return;
  try {
    if (item_type === "book") {
      const book = await bookService.getBookById(item_id);
      if (book?.instructor_id) {
        await walletService.increment(book.instructor_id, numericAmount);
      }
    } else if (item_type === "class") {
      const cls = await classService.getClassById(item_id);
      if (cls?.instructor_id) {
        await walletService.increment(cls.instructor_id, numericAmount);
      }
    } else if (item_type === "tutorial") {
      const tut = await tutorialService.getTutorialById(item_id);
      if (tut?.instructor_id) {
        await walletService.increment(tut.instructor_id, numericAmount);
      }
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
    if (item_type === "class") {
      const cls = await classService.getClassById(item_id);
      instructorId = cls?.instructor_id;
    } else if (item_type === "tutorial") {
      const tut = await tutorialService.getTutorialById(item_id);
      instructorId = tut?.instructor_id;
    } else if (item_type === "book") {
      const book = await bookService.getBookById(item_id);
      instructorId = book?.instructor_id;
    }

    if (instructorId) {
      await walletService.increment(instructorId, amount, trx);
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

  if (arguments.length > 4) {
    subscriptionId = subscriptionIdOrTrx;
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
    const tut = await tutorialService.getTutorialById(tutorialId);
    if (tut?.instructor_id) {
      await walletService.increment(tut.instructor_id, amount, trx);
    }
  } catch (err) {
    logger.error(
      "Failed to credit instructor wallet from tutorial subscription:",
      err,
    );
  }
}

async function creditInstructorFromPayment(payment) {
  if (!payment) return;
  const amount = Number(payment.instructor_amount);
  if (!Number.isFinite(amount) || amount <= 0) return;
  await creditInstructorWallet(payment.item_type, payment.item_id, amount);
}

module.exports = {
  creditInstructorWallet,
  creditInstructorSubscription,
  creditTutorialSubscription,
  creditInstructorFromPayment,
};
