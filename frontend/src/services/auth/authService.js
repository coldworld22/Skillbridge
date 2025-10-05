// 📁 src/services/auth/authService.js
import api from "@/services/api/api";
import logger from "@/utils/logger";
import { ensureCsrfToken } from "@/services/api/csrf";
import { getCookie } from "@/utils/cookies";
import { normalizeError } from "@/utils/error";

/**
 * 🔐 Log in a user and retrieve access token and user info.
 * Stores refresh token via HttpOnly cookie (server-side).
 * 
 * @param {Object} credentials - User credentials
 * @param {string} credentials.email
 * @param {string} credentials.password
 * @returns {Promise<{ message: string, user: object }>}
 */
export const loginUser = async ({
  email,
  password,
  recaptchaToken,
  recaptchaBypass,
}) => {
  try {
    logger.log(
      "🔐 loginUser requesting",
      `${api.defaults.baseURL}/auth/login`
    );
    const res = await api.post("auth/login", {
      email,
      password,
      recaptchaToken,
      recaptchaBypass,
    });
    // Ensure the CSRF cookie from the backend is present for subsequent requests
    await ensureCsrfToken();
    return res.data;
  } catch (err) {
    logger.error("❌ loginUser error", {
      message: err?.message,
      status: err?.response?.status,
    });
    throw normalizeError(err);
  }
};

/**
 * 🧾 Register a new user account (Student, Instructor, Admin).
 * 
 * @param {Object} payload - Registration data
 * @returns {Promise<{ message: string, user: object }>}
 */
export const registerUser = async (payload) => {
  try {
    const res = await api.post("auth/register", payload);
    return res.data;
  } catch (err) {
    throw normalizeError(err);
  }
};

/**
 * 📧 Request OTP to reset password (step 1).
 * 
 * @param {{email: string, via?: string}} payload
 * @returns {Promise<{ message: string }>}
 */
export const requestPasswordReset = async ({ email, via = "email" }) => {
  try {
    const res = await api.post("auth/forgot-password", { email, via });
    return res.data;
  } catch (err) {
    throw normalizeError(err);
  }
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
  try {
    const res = await api.post("auth/verify-otp", { email, code });
    return res.data;
  } catch (err) {
    throw normalizeError(err);
  }
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
  try {
    const res = await api.post("auth/reset-password", {
      email,
      code,
      new_password,
    });
    return res.data;
  } catch (err) {
    throw normalizeError(err);
  }
};

/**
 * 🔁 Manually refresh the access token.
 * Uses HttpOnly refresh cookie set during login.
 * 
 * @returns {Promise<{ accessToken: string }>}
 */
export const refreshAccessToken = async () => {
  try {
    const csrfCookie = getCookie("csrfToken");
    const csrfToken = await ensureCsrfToken(
      csrfCookie ? undefined : { forceRefresh: true }
    );
    const res = await api.post(
      "auth/refresh",
      null,
      {
        headers: csrfToken ? { "x-csrf-token": csrfToken } : {},
      }
    );
    await ensureCsrfToken();
    return res.data;
  } catch (err) {
    throw normalizeError(err);
  }
};

/**
 * 🚪 Log out user and clear the refresh token cookie.
 * 
 * @returns {Promise<{ message: string }>}
 */
export const logoutUser = async () => {
  try {
    const res = await api.post("auth/logout");
    return res.data;
  } catch (err) {
    throw normalizeError(err);
  }
};
