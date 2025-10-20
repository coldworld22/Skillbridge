import api from "@/services/api/api";
import { API_BASE_URL } from "@/config/config";
import { safeEncodeURI } from "@/utils/url";

const withBaseUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http")) return safeEncodeURI(url);
  return safeEncodeURI(`${process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE_URL || ""}${url}`);
};

const formatPlan = (plan = {}) => {
  const copy = { ...plan };
  if (Array.isArray(copy.included_classes)) {
    copy.included_classes = copy.included_classes.map((cls) => ({
      ...cls,
      cover_image: withBaseUrl(cls.cover_image || ""),
    }));
  }
  if (Array.isArray(copy.included_tutorials)) {
    copy.included_tutorials = copy.included_tutorials.map((tutorial) => ({
      ...tutorial,
      cover_image: withBaseUrl(tutorial.cover_image || ""),
    }));
  }
  if (Array.isArray(copy.included_books)) {
    copy.included_books = copy.included_books.map((book) => ({
      ...book,
      cover_image: withBaseUrl(book.cover_image || ""),
    }));
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
