import api from "@/services/api/api";
import { API_BASE_URL } from "@/config/config";
import { buildUrl } from "@/utils/url";

const coerceText = (value, lang = "en") => {
  if (value == null) return "";
  const t = typeof value;
  if (t === "string") return value;
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

const normalizeLibraryItem = (item) => {
  const coverUrl =
    buildUrl(item?.coverUrl) ||
    buildUrl(item?.cover_image_url) ||
    buildUrl(item?.cover_image) ||
    "/images/default-book-cover.jpg";

  const previewUrl = buildUrl(item?.previewUrl || item?.preview_url);
  const pdfUrl = buildUrl(item?.pdfUrl || item?.pdf_url);

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
