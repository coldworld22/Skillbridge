const walletService = require("../../payouts/wallet.service");
const bookService = require("../../books/book.service");
const classService = require("../../classes/class.service");
const tutorialService = require("../../users/tutorials/tutorial.service");
const logger = require("../../../utils/logger.js");

async function creditInstructorWallet(item_type, item_id, amount) {
  try {
    if (item_type === "book") {
      const book = await bookService.getBookById(item_id);
      if (book?.instructor_id) {
        await walletService.increment(book.instructor_id, amount);
      }
    } else if (item_type === "class") {
      const cls = await classService.getClassById(item_id);
      if (cls?.instructor_id) {
        await walletService.increment(cls.instructor_id, amount);
      }
    } else if (item_type === "tutorial") {
      const tut = await tutorialService.getTutorialById(item_id);
      if (tut?.instructor_id) {
        await walletService.increment(tut.instructor_id, amount);
      }
    }
  } catch (err) {
    logger.error("Failed to credit instructor wallet:", err);
  }
}

module.exports = { creditInstructorWallet };
