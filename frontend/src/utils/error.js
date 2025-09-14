import { toast } from "react-toastify";

/**
 * Normalize API errors to a consistent shape.
 * @param {any} error - Error thrown by Axios or fetch
 * @returns {{status: number, message: string}}
 */
export const normalizeError = (error) => {
  const status = error?.response?.status || 500;
  const message =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "An unexpected error occurred";
  return { status, message };
};

/**
 * Show a toast for a normalized error.
 * @param {any} error
 * @param {string} [fallback]
 */
export const handleError = (error, fallback) => {
  const { message } = normalizeError(error);
  toast.error(message || fallback || "An unexpected error occurred");
};

export default normalizeError;
