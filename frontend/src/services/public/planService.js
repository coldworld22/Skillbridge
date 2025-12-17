import api from "@/services/api/api";
import { API_BASE_URL } from "@/config/config";
import { safeEncodeURI } from "@/utils/url";

const withBaseUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http")) return safeEncodeURI(url);
  return safeEncodeURI(`${process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE_URL || ""}${url}`);
};

const applyMediaBaseUrl = (items, keys = []) => {
  if (!Array.isArray(items)) return items;
  return items.map((item) => {
    const formatted = { ...item };
    keys.forEach((key) => {
      if (formatted[key]) {
        formatted[key] = withBaseUrl(formatted[key]);
      }
    });
    return formatted;
  });
};

const formatPlan = (plan = {}) => {
  return {
    ...plan,
    included_classes: applyMediaBaseUrl(plan.included_classes, ["cover_image"]),
    included_tutorials: applyMediaBaseUrl(plan.included_tutorials, [
      "cover_image",
      "preview_video",
    ]),
    included_books: applyMediaBaseUrl(plan.included_books, [
      "cover_image",
      "cover_image_url",
    ]),
  };
};

export const fetchPublicPlans = async (role) => {
  const normalizedRole =
    role && String(role).toLowerCase() !== "all" ? role : undefined;
  const params = normalizedRole ? { role: normalizedRole } : {};
  const { data } = await api.get("/plans", { params });
  const list = data?.data ?? [];
  return list.map(formatPlan);
};

export const fetchPlanDetails = async (id) => {
  const { data } = await api.get(`/plans/${id}`);
  return formatPlan(data?.data ?? data);
};
