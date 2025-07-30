const thirdPartyConfig = require('../thirdPartyConfig/thirdPartyConfig.service');

exports.answerWithAI = async (provider, question) => {
  const cfg = (await thirdPartyConfig.getSettings()) || {};
  const settings = cfg[provider] || {};
  if (!settings.apiKey || settings.active === false) {
    return { answer: null, error: 'Provider not configured' };
  }
  // This is a stub. Replace with real API calls.
  return {
    answer: `(${provider}) AI answer for: ${question}`,
    confidence: 0.9,
  };
};
