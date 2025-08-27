import api from "@/services/api/api";

/**
 * Send a question to the AI backend and return the answer.
 * @param {string} provider - AI provider key
 * @param {string} question - Question text
 * @param {string} [model] - Optional model name
 * @returns {Promise<object>} { answer: string, ... }
 */
export const askAI = async (provider, question, model) => {
  // Use the backend AI assistance endpoint which reads API keys from
  // the third party configuration settings. Older code pointed to `/ai`
  // but the server exposes `/api/ai-assistance`.
  const { data } = await api.post("/ai-assistance", {
    provider,
    question,
    model,
  });
  if (data?.error) {
    throw new Error(data.error.message || "AI request failed");
  }
  return data?.data ?? data;
};

export default { askAI };
