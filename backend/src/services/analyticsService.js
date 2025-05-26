// 📁 src/services/analyticsService.js
module.exports = {
  logEvent: async (userId, action, metadata = {}) => {
    console.log(`[Analytics] ${userId} performed ${action}`, metadata);
  },
};