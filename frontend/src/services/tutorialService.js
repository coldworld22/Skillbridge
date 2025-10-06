import api from "@/services/api/api";
import { extractData } from "@/services/api/helpers";
import { API_BASE_URL } from "@/config/config";
import { joinUrl } from "@/utils/url";

const ABSOLUTE_URL_REGEX = /^[a-zA-Z][a-zA-Z\d+.-]*:\/\//;

function resolveAssetBase() {
  const explicitBase = process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE_URL;

  if (ABSOLUTE_URL_REGEX.test(explicitBase || "")) {
    return explicitBase;
  }

  if (typeof window === "undefined") {
    const internalBase = process.env.INTERNAL_API_BASE_URL;
    if (ABSOLUTE_URL_REGEX.test(internalBase || "")) {
      return internalBase;
    }

    const appDomain = process.env.APP_DOMAIN;
    if (appDomain) {
      const isLocalhost = /^localhost(:\d+)?$/i.test(appDomain);
      const protocol = isLocalhost ? "http" : "https";
      const normalizedDomain = appDomain.replace(/\/+$/, "");
      const relative = explicitBase
        ? explicitBase.startsWith("/")
          ? explicitBase
          : `/${explicitBase}`
        : "";
      return `${protocol}://${normalizedDomain}${relative}`;
    }
  }

  return explicitBase;
}

export const formatTutorial = (tut) => {
  const baseUrl = resolveAssetBase();
  const thumbnailPath = tut.thumbnail_url || tut.cover_image;
  const previewPath = tut.preview_video;

  const rawPrice =
    tut.price ??
    tut.originalPrice ??
    tut.original_price ??
    tut.cost ??
    null;

  const rawDiscount = tut.discountPrice ?? tut.discount_price ?? null;

  const currency =
    tut.currency || tut.currency_code || tut.currencyCode || undefined;

  const tagArray = Array.isArray(tut.tags)
    ? tut.tags
        .map((tag) =>
          typeof tag === "string" ? tag : tag.name || tag.slug || tag.tag_name
        )
        .filter(Boolean)
    : typeof tut.tags === "string"
      ? tut.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      : Array.isArray(tut.tag_list || tut.tagList || tut.tutorial_tags)
        ? (tut.tag_list || tut.tagList || tut.tutorial_tags)
            .map((tag) =>
              typeof tag === "string" ? tag : tag.name || tag.slug || tag.tag_name
            )
            .filter(Boolean)
        : [];

  const rating =
    typeof tut.rating === "string" || typeof tut.rating === "number"
      ? parseFloat(tut.rating)
      : 0;

  const ratingCount = parseInt(
    tut.ratingCount ?? tut.rating_count ?? tut.reviews_count ?? 0,
    10,
  );

  return {
    ...tut,
    thumbnail: thumbnailPath ? joinUrl(baseUrl, thumbnailPath) : null,
    preview: previewPath ? joinUrl(baseUrl, previewPath) : null,
    instructor: tut.instructor_name || tut.instructor,
    instructorAvatar: tut.instructor_avatar
      ? joinUrl(baseUrl, tut.instructor_avatar)
      : null,
    instructorBio: tut.instructor_bio || tut.instructorBio,
    price: rawPrice == null ? null : parseFloat(rawPrice),
    discountPrice: rawDiscount == null ? null : parseFloat(rawDiscount),
    currency,
    rating,
    ratingCount,
    tags: tagArray,
    trending: Boolean(tut.trending),
    // Normalize category fields so components can filter reliably
    categoryId: (() => {
      const id =
        tut.category_id != null
          ? tut.category_id
          : tut.categoryId != null
            ? tut.categoryId
            : null;
      return id != null ? Number(id) : null;
    })(),
    categoryName:
      tut.category || tut.category_name || tut.categoryName || null,
    // Keep legacy `category` field for backward compatibility
    category: tut.category || tut.category_name || tut.categoryName || null,
  };
};

const mapTutorialList = (res) => {
  const list = extractData(res);
  return Array.isArray(list) ? list.map(formatTutorial) : list;
};

export const fetchFeaturedTutorials = async (config = {}) => {
  const cfg = Object.keys(config).length ? config : undefined;

  try {
    const res = await api.get("users/tutorials/featured", cfg);
    return mapTutorialList(res);
  } catch (error) {
    const status = error?.response?.status;

    if (status === 404 || status === 410 || status === 301) {
      const res = await api.get("tutorials/featured", cfg);
      return mapTutorialList(res);
    }

    throw error;
  }
};

export const fetchPublishedTutorials = async ({ page, limit, ...config } = {}) => {
  const params = { ...(config?.params || {}) };
  if (page != null) params.page = page;
  if (limit != null) params.limit = limit;

  const res = await api.get("users/tutorials", { ...config, params });
  const list = extractData(res);
  return Array.isArray(list) ? list.map(formatTutorial) : list;
};

export const fetchTutorialDetails = async (id) => {
  const res = await api.get(`users/tutorials/${id}`);
  const tut = res.data?.data ?? res.data;
  return tut ? formatTutorial(tut) : tut;
};

export const enrollInTutorial = async (tutorialId) => {
  const { data } = await api.post(`users/tutorials/enroll/${tutorialId}`);
  return data;
};

export const getMyEnrolledTutorials = async (config = {}) => {
  try {
    const cfg = Object.keys(config).length ? config : undefined;
    const res = await api.get('users/tutorials/enroll/my', cfg);
    const list = extractData(res);
    return list.map(formatTutorial);
  } catch (err) {
    if (err.response && [401, 403].includes(err.response.status)) {
      return [];
    }
    throw err;
  }
};

export const saveTutorialProgress = async (tutorialId, progress) => {
  try {
    const { data } = await api.patch(
      `users/tutorials/enroll/${tutorialId}/progress`,
      { progress },
    );
    return data?.data ?? data;
  } catch (err) {
    // Ignore if API not supported
    if (err.response && [404, 500, 501].includes(err.response.status)) {
      return null;
    }
    throw err;
  }
};

export const addTutorialToWishlist = async (id) => {
  const { data } = await api.post(`users/tutorials/wishlist/${id}`);
  return data;
};

export const removeTutorialFromWishlist = async (id) => {
  const { data } = await api.delete(`users/tutorials/wishlist/${id}`);
  return data;
};

export const getMyTutorialWishlist = async (config = {}) => {
  const cfg = Object.keys(config).length ? config : undefined;
  const res = await api.get('users/tutorials/wishlist/my', cfg);
  return extractData(res);
};

export const addTutorialToFavorites = async (id) => {
  const { data } = await api.post(`users/tutorials/favorites/${id}`);
  return data;
};

export const removeTutorialFromFavorites = async (id) => {
  const { data } = await api.delete(`users/tutorials/favorites/${id}`);
  return data;
};

export const getMyTutorialFavorites = async (config = {}) => {
  const cfg = Object.keys(config).length ? config : undefined;
  const res = await api.get('users/tutorials/favorites/my', cfg);
  return extractData(res);
};

export const fetchTutorialReviews = async (tutorialId) => {
  const res = await api.get(`users/tutorials/reviews/${tutorialId}`);
  return extractData(res);
};

export const submitTutorialReview = async (tutorialId, payload) => {
  const { data } = await api.post(`users/tutorials/reviews/${tutorialId}`, payload);
  return data;
};

export const fetchTutorialComments = async (tutorialId) => {
  const res = await api.get(`users/tutorials/comments/${tutorialId}`);
  return extractData(res);
};

export const postTutorialComment = async (tutorialId, payload) => {
  const { data } = await api.post(`users/tutorials/comments/${tutorialId}`, payload);
  return data;
};

// Fetch assignments linked to a tutorial
export const fetchTutorialAssignments = async (tutorialId) => {
  const res = await api.get(`users/tutorials/assignments/${tutorialId}`);
  return extractData(res);
};

// Retrieve the current user's enrollment status and progress for a tutorial
export const fetchTutorialProgress = async (tutorialId) => {
  try {
    const { data } = await api.get(
      `users/tutorials/enroll/${tutorialId}/status`,
    );
    return data?.data ?? data ?? null;
  } catch (err) {
    // Ignore if API not supported
    if (err.response && [404, 500, 501].includes(err.response.status)) {
      return null;
    }
    throw err;
  }
};

// Retrieve enrollment status and progress for multiple tutorials
export const fetchTutorialProgressBatch = async (tutorialIds) => {
  try {
    const { data } = await api.post(
      'users/tutorials/enroll/status/batch',
      { tutorialIds },
    );
    return data?.data ?? data ?? null;
  } catch (err) {
    if (err.response && [404, 500, 501].includes(err.response.status)) {
      return null;
    }
    throw err;
  }
};
