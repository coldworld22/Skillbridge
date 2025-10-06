import axios from "axios";
import api from "@/services/api/api";

// Use a dedicated public Axios client that skips auth/CSRF interceptors and
// cookies so the request can succeed even when the backend runs on a different
// domain without CORS support for credentials or custom headers.
const publicApi = axios.create({
  baseURL: api.defaults.baseURL,
  withCredentials: false,
});

export const fetchSocialLoginConfig = async () => {
  const { data } = await publicApi.get("social-login/config");
  return data?.data ?? null;
};
