import api from "@/services/api/api";
import { API_BASE_URL } from "@/config/config";
import { buildUrl } from "@/utils/url";

const coerceText = (value, lang = "en") => {
  if (value == null) return "";
  const t = typeof value;
  if (t === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "";
    const lower = trimmed.toLowerCase();
    if (lower === "null" || lower === "undefined") return "";
    return trimmed;
  }
  if (t === "number" || t === "boolean") return String(value);
  if (Array.isArray(value)) return value.map((v) => coerceText(v, lang)).filter(Boolean).join(", ");
  if (t === "object") {
    if (value instanceof Date) return value.toISOString();
    if (value[lang] && typeof value[lang] === "string") return value[lang];
    if (value.en && typeof value.en === "string") return value.en;
    const firstString = Object.values(value).find((v) => typeof v === "string");
    if (firstString) return firstString;
  }
  return "";
};

const coerceUrl = (value, lang = "en") => {
  if (value == null) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const lower = trimmed.toLowerCase();
    if (lower === "null" || lower === "undefined" || lower === "false") return null;
    return trimmed;
  }
  if (typeof value === "object") {
    if (typeof value.url === "string") return coerceUrl(value.url, lang);
    if (typeof value.href === "string") return coerceUrl(value.href, lang);
    if (typeof value.src === "string") return coerceUrl(value.src, lang);
    const localized = value[lang];
    if (typeof localized === "string") return coerceUrl(localized, lang);
    const english = value.en;
    if (typeof english === "string") return coerceUrl(english, lang);
  }
  if (Array.isArray(value)) {
    for (const entry of value) {
      const resolved = coerceUrl(entry, lang);
      if (resolved) return resolved;
    }
  }
  return coerceText(value, lang) || null;
};

const resolveMediaUrl = (value, lang = "en") => {
  const candidate = coerceUrl(value, lang);
  if (!candidate) return null;
  return buildUrl(candidate) || candidate;
};

const normalizeLibraryItem = (item) => {
  const coverUrl =
    resolveMediaUrl(item?.coverUrl) ||
    resolveMediaUrl(item?.cover_image_url) ||
    resolveMediaUrl(item?.cover_image) ||
    "/images/default-book-cover.jpg";

  const previewUrl = resolveMediaUrl(item?.previewUrl || item?.preview_url);
  const pdfUrl = resolveMediaUrl(item?.pdfUrl || item?.pdf_url);

  return {
    ...item,
    // Provide consistent camelCase helpers while keeping the original fields.
    title: coerceText(item?.title || item?.name || item?.book_title),
    shortDescription: coerceText(item?.shortDescription ?? item?.short_description ?? ""),
    coverUrl,
    cover_image_url: coverUrl,
    previewUrl: previewUrl || null,
    preview_url: previewUrl || null,
    pdfUrl: pdfUrl || null,
    pdf_url: pdfUrl || null,
    author: coerceText(item?.author || item?.instructor_name || item?.creator || item?.publisher),
    price_paid:
      item?.price_paid !== undefined
        ? Number(item.price_paid)
        : item?.pricePaid !== undefined
        ? Number(item.pricePaid)
        : undefined,
    isFree:
      item?.isFree !== undefined
        ? Boolean(item.isFree)
        : item?.price_paid !== undefined
        ? Number(item.price_paid) === 0
        : item?.pricePaid !== undefined
        ? Number(item.pricePaid) === 0
        : undefined,
    purchasedAt: item?.purchasedAt ?? item?.purchased_at ?? null,
    tags: Array.isArray(item?.tags)
      ? item.tags.map((t) => coerceText(typeof t === 'object' ? (t?.name || t?.label || t?.title || t) : t)).filter(Boolean)
      : item?.tags
      ? [coerceText(item.tags)].filter(Boolean)
      : [],
    downloadUrl:
      item?.downloadUrl ||
      (item?.id ? `${API_BASE_URL}/library/download/${item.id}` : null),
  };
};

export const fetchLibrary = async () => {
  const { data } = await api.get("/library");
  if (!Array.isArray(data?.data)) return [];
  return data.data.map(normalizeLibraryItem);
};

export default { fetchLibrary };
