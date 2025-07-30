import api from "@/services/api/api";

/**
 * Send a question to the AI backend and return the answer.
 * @param {string} provider - AI provider key
 * @param {string} question - Question text
 * @param {string} [model] - Optional model name
 * @returns {Promise<object>} { answer: string, ... }
 */
export const askAI = async (provider, question, model) => {
  const { data } = await api.post("/ai", { provider, question, model });
  return data?.data ?? data;
};

export default { askAI };
