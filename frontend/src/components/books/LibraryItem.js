import { API_BASE_URL } from "@/config/config";
import { buildUrl } from "@/utils/url";
import { formatCurrency } from "@/utils/currency";
import { FiDownload, FiEye } from "react-icons/fi";

export default function LibraryItem({ item }) {
  const price =
    item?.price_paid !== undefined && item.price_paid !== null
      ? Number(item.price_paid)
      : item?.price !== undefined
      ? Number(item.price)
      : null;
  const isFree = price === 0;
  const purchaseDate = item?.purchasedAt
    ? new Date(item.purchasedAt)
    : item?.purchased_at
    ? new Date(item.purchased_at)
    : null;
  const previewUrl = item?.previewUrl || buildUrl(item?.preview_url);
  const downloadUrl =
    item?.downloadUrl ||
    (item?.id ? `${API_BASE_URL}/library/download/${item.id}` : null);

  return (
    <div className="flex flex-col gap-2 border-b py-3 md:flex-row md:items-center md:justify-between">
      <div className="space-y-1">
        <h4 className="font-medium text-gray-900 dark:text-gray-100">
          {item.title}
        </h4>
        {item.author && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {item.author}
          </p>
        )}
        {price !== null && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {isFree ? "Free" : formatCurrency(price)}
          </p>
        )}
        {purchaseDate && !Number.isNaN(purchaseDate.getTime()) && (
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Purchased on {purchaseDate.toLocaleDateString()}
          </p>
        )}
      </div>
      <div className="flex gap-3 text-sm font-medium">
        {previewUrl && (
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-indigo-600 hover:underline"
          >
            <FiEye /> Preview
          </a>
        )}
        {downloadUrl && (
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-600 hover:underline"
          >
            <FiDownload /> Download
          </a>
        )}
      </div>
    </div>
  );
}
