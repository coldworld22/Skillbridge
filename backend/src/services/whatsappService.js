const logger = require('../utils/logger.js');
module.exports = {
  sendWhatsApp: async ({ to, message }) => {
    // Integrate with Twilio or another provider here
    logger.log(`Sending WhatsApp message to ${to}: ${message}`);
  },
};
