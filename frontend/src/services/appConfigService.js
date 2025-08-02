import axios from "axios";
import { API_BASE_URL } from "@/config/config";

/**
 * Fetch global application configuration.
 *
 * This endpoint is public and should work for guests as well as
 * authenticated users.  We intentionally omit credentials so that
 * browsers don't enforce stricter CORS rules, which previously caused
 * the request to fail for unauthenticated visitors and hid the hero
 * background image.
 */
export const getAppConfig = async () => {
  const { data } = await axios.get(`${API_BASE_URL}/app-config`, {
    withCredentials: false,
  });
  return data?.data ?? data ?? {};
};
