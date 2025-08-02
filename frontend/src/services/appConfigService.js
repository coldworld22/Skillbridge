import axios from "axios";
import { API_BASE_URL } from "@/config/config";

export const getAppConfig = async () => {
  const { data } = await axios.get(`${API_BASE_URL}/app-config`, {
    withCredentials: true,
  });
  return data?.data ?? {};
};
