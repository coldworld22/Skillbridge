import { toast } from "react-toastify";

/**
 * Display a user friendly error message based on HTTP status.
 * @param {any} err - Error object from axios.
 * @param {string} fallbackMessage - Message to display when status is not handled.
 */
export default function handleApiError(err, fallbackMessage = "Request failed") {
  if (err?.statusMessage) {
    toast.error(err.statusMessage);
    return;
  }

  const status = err?.response?.status;

  if (status === 401) {
    toast.error("Please log in to continue");
  } else if (status && status >= 500) {
    toast.error("Server error. Please try again later.");
  } else {
    toast.error(err?.response?.data?.message || fallbackMessage);
  }
}
