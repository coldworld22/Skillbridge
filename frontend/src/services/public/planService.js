import api from "@/services/api/api";
import { API_BASE_URL } from "@/config/config";
import { safeEncodeURI } from "@/utils/url";

const withBaseUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http")) return safeEncodeURI(url);
  return safeEncodeURI(`${process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE_URL || ""}${url}`);
};

const applyMediaBaseUrl = (items = [], keys = []) =>
  items.map((item) => {
    const formatted = { ...item };
    keys.forEach((key) => {
      if (formatted[key]) {
        formatted[key] = withBaseUrl(formatted[key]);
      }
    });
    return formatted;
  });

const formatPlan = (plan = {}) => {
  const copy = { ...plan };
  if (Array.isArray(copy.included_classes)) {
    copy.included_classes = applyMediaBaseUrl(copy.included_classes, [
      "cover_image",
    ]);
  }
  if (Array.isArray(copy.included_tutorials)) {
    copy.included_tutorials = applyMediaBaseUrl(copy.included_tutorials, [
      "cover_image",
      "preview_video",
    ]);
  }
  if (Array.isArray(copy.included_books)) {
    copy.included_books = applyMediaBaseUrl(copy.included_books, [
      "cover_image_url",
    ]);
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
  if (Array.isArray(copy.included_books)) {
    copy.included_books = copy.included_books.map((book) => ({
      ...book,
      cover_image_url: withBaseUrl(book.cover_image_url || ""),
    }));
  }
  if (Array.isArray(copy.included_tutorials)) {
    copy.included_tutorials = copy.included_tutorials.map((tutorial) => ({
      ...tutorial,
      cover_image: withBaseUrl(tutorial.cover_image || ""),
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
