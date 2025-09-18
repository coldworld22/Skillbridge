import api from "@/services/api/api";

export const fetchSocialLoginConfig = async () => {
  const { data } = await api.get("/social-login/config", {
    // This endpoint only returns public config so skip credentials to avoid
    // cross-site cookie requirements that would otherwise trigger CORS errors
    // in environments where the backend domain differs from the frontend.
    withCredentials: false,
  });
  return data?.data ?? null;
};
