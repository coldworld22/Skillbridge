import api from "@/services/api/api";
import { toast } from "react-toastify";
import { i18n } from "next-i18next";

export const clearCache = async () => {
  await api.post("/admin/cache/clear");
};