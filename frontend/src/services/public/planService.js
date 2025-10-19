import api from "@/services/api/api";
import { API_BASE_URL } from "@/config/config";
import { safeEncodeURI } from "@/utils/url";

const withBaseUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http")) return safeEncodeURI(url);
  return safeEncodeURI(`${process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE_URL || ""}${url}`);
};

const withCoverUrls = (items = [], field = "cover_image") =>
  items.map((item) => ({
    ...item,
    [field]: withBaseUrl(item?.[field] || ""),
  }));

const formatPlan = (plan = {}) => {
  const copy = { ...plan };
  if (Array.isArray(copy.included_classes)) {
    copy.included_classes = withCoverUrls(copy.included_classes);
  }
  if (Array.isArray(copy.included_books)) {
    copy.included_books = withCoverUrls(copy.included_books);
  }
  if (Array.isArray(copy.included_tutorials)) {
    copy.included_tutorials = withCoverUrls(copy.included_tutorials);
  }
  return copy;
};

export const fetchPublicPlans = async (role) => {
  const params = role ? { role } : {};
  const { data } = await api.get("/plans", { params });
  const list = data?.data ?? [];
  return list.map(formatPlan);
};

export const fetchPlanDetails = async (id) => {
  const { data } = await api.get(`/plans/${id}`);
  return formatPlan(data?.data ?? data);
};
