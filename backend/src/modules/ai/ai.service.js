const thirdPartyConfig = require('../thirdPartyConfig/thirdPartyConfig.service');

exports.answerWithAI = async (provider, question) => {
  const cfg = (await thirdPartyConfig.getSettings()) || {};
  const settings = cfg[provider] || {};
  if (!settings.apiKey) {
    return { answer: null, error: 'No API key configured' };
  }
  // This is a stub. Replace with real API calls.
  return {
    answer: `(${provider}) AI answer for: ${question}`,
    confidence: 0.9,
  };
};
