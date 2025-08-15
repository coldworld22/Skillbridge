import { buildUrl } from "@/utils/url";

export default function LibraryItem({ item }) {
  return (
    <div className="flex items-center justify-between border-b py-2">
      <div>
        <h4 className="font-medium">{item.title}</h4>
        {item.price && (
          <p className="text-sm text-gray-600">{`$${item.price}`}</p>
        )}
      </div>
      <a
        href={buildUrl(item.pdfUrl)}
        className="text-blue-600 underline"
      >
        Download
      </a>
    </div>
  );
}
