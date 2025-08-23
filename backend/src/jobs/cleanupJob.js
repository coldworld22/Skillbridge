const logger = require('../utils/logger.js');
const offerService = require("../modules/offers/offers.service");

function startCleanupJob() {
  setInterval(async () => {
    try {
      await offerService.deleteExpiredOffers();
    } catch (err) {
      logger.error("Error running cleanup job:", err.message);
    }
  }, 60 * 60 * 1000); // hourly
}

module.exports = startCleanupJob;

