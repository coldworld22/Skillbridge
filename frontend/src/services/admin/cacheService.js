import api from "@/services/api/api";
import { toast } from "react-toastify";
import { i18n } from "next-i18next";

export const clearCache = () => api.post("/admin/cache/clear");
