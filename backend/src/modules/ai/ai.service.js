const thirdPartyConfig = require('../thirdPartyConfig/thirdPartyConfig.service');

/**
 * Send a question to an AI provider and return the answer.
 * Currently supports the ChatGPT API when the provider key is "chatgpt".
 * Other providers fall back to a simple stubbed response.
 */
exports.answerWithAI = async (provider, question) => {
  const cfg = (await thirdPartyConfig.getSettings()) || {};
  const settings = cfg[provider] || {};

  if (!settings.apiKey) {
    return { answer: null, error: 'No API key configured' };
  }

  if (provider === 'chatgpt') {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.apiKey}`,
        },
        body: JSON.stringify({
          model: settings.model || 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: question }],
          temperature: settings.temperature ?? 0.7,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        return { answer: null, error: text };
      }

      const data = await res.json();
      const answer = data.choices?.[0]?.message?.content?.trim();
      return { answer, confidence: 0.9 };
    } catch (err) {
      return { answer: null, error: err.message };
    }
  }

  // Fallback stub for providers not yet implemented
  return {
    answer: `(${provider}) AI answer for: ${question}`,
    confidence: 0.9,
  };
};
