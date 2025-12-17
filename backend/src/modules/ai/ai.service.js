const thirdPartyConfig = require('../thirdPartyConfig/thirdPartyConfig.service');

/**
 * Send a question to an AI provider and return the answer.
 * Currently supports the ChatGPT API when the provider key is "chatgpt".
 * A specific ChatGPT model can be chosen via the `model` argument when
 * multiple models are configured in the settings.
 * Other providers fall back to a simple stubbed response.
 */
exports.answerWithAI = async (provider, question, model) => {
  const cfg = (await thirdPartyConfig.getSettings()) || {};
  const settings = cfg[provider] || {};
  if (settings.active === false) {
    return { answer: null, error: 'Provider inactive' };
  }

  // Each provider may store its credential under different keys. Perform a
  // generic check here only when no provider specific credential exists.
  if (!settings.apiKey && !settings.token) {
    return { answer: null, error: 'No API key configured' };
  }

  if (provider === 'chatgpt') {
    try {
      const models = Array.isArray(settings.models)
        ? settings.models
        : settings.model
          ? [{ name: settings.model, temperature: settings.temperature }]
          : [];

      const selected = model
        ? models.find((m) => m.name === model)
        : models[0];

      if (!selected) {
        return { answer: null, error: 'Model not configured' };
      }

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.apiKey}`,
        },
        body: JSON.stringify({
          model: selected.name,
          messages: [{ role: 'user', content: question }],
          temperature:
            selected.temperature ?? settings.temperature ?? 0.7,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        try {
          const json = JSON.parse(text);
          const msg = json.error?.message || text;
          const code = json.error?.code;
          if (code === 'insufficient_quota' || /insufficient quota/i.test(msg)) {
            return {
              answer: null,
              error: 'AI API request failed: your account has no remaining credits.',
            };
          }
          return { answer: null, error: msg };
        } catch (e) {
          return { answer: null, error: text };
        }
      }

      const data = await res.json();
      const answer = data.choices?.[0]?.message?.content?.trim();
      return { answer, confidence: 0.9 };
    } catch (err) {
      return { answer: null, error: err.message };
    }
  }

  if (provider === 'huggingface') {
    try {
      const url = `https://api-inference.huggingface.co/models/${settings.model}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.token || settings.apiKey}`,
        },
        body: JSON.stringify({ inputs: question }),
      });

      if (!res.ok) {
        const text = await res.text();
        return { answer: null, error: text };
      }

      const data = await res.json();
      let answer = '';
      if (Array.isArray(data) && data[0]?.generated_text) answer = data[0].generated_text;
      else if (data?.generated_text) answer = data.generated_text;
      else if (data?.answer) answer = data.answer;
      else answer = JSON.stringify(data);
      return { answer, confidence: 0.9 };
    } catch (err) {
      return { answer: null, error: err.message };
    }
  }

  if (provider === 'deepseek') {
    try {
      const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.apiKey}`,
        },
        body: JSON.stringify({
          model: settings.model || 'deepseek-chat',
          messages: [{ role: 'user', content: question }],
          max_tokens: settings.maxTokens || settings.max_tokens || 1024,
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
