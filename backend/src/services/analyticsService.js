const logger = require('../utils/logger.js');
// 📁 src/services/analyticsService.js
module.exports = {
  logEvent: async (userId, action, metadata = {}) => {
    logger.log(`[Analytics] ${userId} performed ${action}`, metadata);
  },
};