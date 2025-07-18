// 📁 src/services/auth/authService.js
import api from "@/services/api/api";

/**
 * 🔐 Log in a user and retrieve access token and user info.
 * Stores refresh token via HttpOnly cookie (server-side).
 * 
 * @param {Object} credentials - User credentials
 * @param {string} credentials.email
 * @param {string} credentials.password
 * @returns {Promise<{ message: string, user: object }>}
 */
export const loginUser = async ({ email, password, recaptchaToken }) => {
  try {
    console.log("🔐 loginUser requesting", api.defaults.baseURL + "/auth/login");
    const res = await api.post("/auth/login", { email, password, recaptchaToken });
    return res.data;
  } catch (err) {
    console.error("❌ loginUser error", err?.response || err);
    throw err;
  }
};

/**
 * 🧾 Register a new user account (Student, Instructor, Admin).
 * 
 * @param {Object} payload - Registration data
 * @returns {Promise<{ message: string, user: object }>}
 */
export const registerUser = async (payload) => {
  const res = await api.post("/auth/register", payload);
  return res.data;
};

/**
 * 📧 Request OTP to reset password (step 1).
 * 
 * @param {string} email - Email to send OTP to
 * @returns {Promise<{ message: string }>}
 */
export const requestPasswordReset = async (email) => {
  const res = await api.post("/auth/forgot-password", { email });
  return res.data;
};

/**
 * 🔢 Verify OTP code (step 2).
 * 
 * @param {Object} data
 * @param {string} data.email
 * @param {string} data.code
 * @returns {Promise<{ valid: boolean }>}
 */
export const verifyOtpCode = async ({ email, code }) => {
  const res = await api.post("/auth/verify-otp", { email, code });
  return res.data;
};

/**
 * 🔐 Reset user password using verified OTP (step 3).
 * 
 * @param {Object} data
 * @param {string} data.email
 * @param {string} data.code
 * @param {string} data.new_password
 * @returns {Promise<{ message: string }>}
 */
export const resetPassword = async ({ email, code, new_password }) => {
  const res = await api.post("/auth/reset-password", {
    email,
    code,
    new_password,
  });
  return res.data;
};

/**
 * 🔁 Manually refresh the access token.
 * Uses HttpOnly refresh cookie set during login.
 * 
 * @returns {Promise<{ accessToken: string }>}
 */
export const refreshAccessToken = async () => {
  const res = await api.post("/auth/refresh");
  return res.data;
};

/**
 * 🚪 Log out user and clear the refresh token cookie.
 * 
 * @returns {Promise<{ message: string }>}
 */
export const logoutUser = async () => {
  const res = await api.post("/auth/logout");
  return res.data;
};
