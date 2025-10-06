const walletService = require("../../payouts/wallet.service");
const logger = require("../../../utils/logger.js");
const { calculateInstructorAmount } = require("./planRevenue");

let bookService;
let classService;
let tutorialService;

const getBookService = () => {
  if (!bookService) {
    bookService = require("../../books/book.service");
  }
  return bookService;
};

const getClassService = () => {
  if (!classService) {
    classService = require("../../classes/class.service");
  }
  return classService;
};

const getTutorialService = () => {
  if (!tutorialService) {
    tutorialService = require("../../users/tutorials/tutorial.service");
  }
  return tutorialService;
};

async function creditInstructorWallet(item_type, item_id, amount) {
  try {
    if (item_type === "book") {
      const book = await getBookService().getBookById(item_id);
      if (book?.instructor_id) {
        await walletService.increment(book.instructor_id, amount);
      }
    } else if (item_type === "class") {
      const cls = await getClassService().getClassById(item_id);
      if (cls?.instructor_id) {
        await walletService.increment(cls.instructor_id, amount);
      }
    } else if (item_type === "tutorial") {
      const tut = await getTutorialService().getTutorialById(item_id);
      if (tut?.instructor_id) {
        await walletService.increment(tut.instructor_id, amount);
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
  subscriptionId,
  trx,
  precomputedAmount,
  options = {}
) {
  try {
    const calculateOptions =
      precomputedAmount !== undefined
        ? { ...(options || {}), precomputedAmount }
        : options || {};

    const rawAmount = await calculateInstructorAmount(
      planId,
      subscriptionId,
      item_id,
      trx,
      item_type,
      calculateOptions
    );
    const amount = Number.isFinite(rawAmount) ? rawAmount : 0;
    if (amount <= 0) return amount;

    let instructorId;
    if (item_type === "class") {
      const cls = await getClassService().getClassById(item_id);
      instructorId = cls?.instructor_id;
    } else if (item_type === "tutorial") {
      const tut = await getTutorialService().getTutorialById(item_id);
      instructorId = tut?.instructor_id;
    } else if (item_type === "book") {
      const book = await getBookService().getBookById(item_id);
      instructorId = book?.instructor_id;
    }

    if (instructorId) {
      await walletService.increment(instructorId, amount, trx);
      return amount;
    }
    return amount;
  } catch (err) {
    logger.error("Failed to credit instructor wallet from subscription:", err);
    return 0;
  }
}

async function creditTutorialSubscription(
  tutorialId,
  planId,
  subscriptionId,
  trx,
  overrideOrOptions,
  legacyOptions
) {
  let precomputedAmount;
  let options;

  if (typeof overrideOrOptions === "number") {
    precomputedAmount = overrideOrOptions;
    options = legacyOptions;
  } else {
    options = overrideOrOptions;
  }

  return creditInstructorSubscription(
    "tutorial",
    tutorialId,
    planId,
    subscriptionId,
    trx,
    precomputedAmount,
    options
  );
}

module.exports = {
  creditInstructorWallet,
  creditInstructorSubscription,
  creditTutorialSubscription,
};
