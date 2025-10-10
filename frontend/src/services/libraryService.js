import api from "@/services/api/api";
import { API_BASE_URL } from "@/config/config";
import { buildUrl } from "@/utils/url";

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
    shortDescription: item?.shortDescription ?? item?.short_description ?? "",
    coverUrl,
    cover_image_url: coverUrl,
    previewUrl: previewUrl || null,
    preview_url: previewUrl || null,
    pdfUrl: pdfUrl || null,
    pdf_url: pdfUrl || null,
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
    tags: Array.isArray(item?.tags) ? item.tags : item?.tags ? [item.tags] : [],
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
