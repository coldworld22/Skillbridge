// 📁 config.js
// Default API URL should align with backend PORT (5000)
// Default to a relative path so the frontend works on any domain by default
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
