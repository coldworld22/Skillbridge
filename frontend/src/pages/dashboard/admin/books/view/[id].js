// pages/dashboard/admin/books/view/[id].js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/layouts/AdminLayout";
import { fetchBook } from "@/services/bookService";
import { FiArrowLeft } from "react-icons/fi";

export default function AdminViewBookPage() {
  const router = useRouter();
  const { id } = router.query;
  const [book, setBook] = useState(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const data = await fetchBook(id, { admin: true });
        setBook(data);
      } catch (err) {
        console.error("Failed to load book", err);
      }
    };
    load();
  }, [id]);

  if (!book) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center text-gray-600">
          Loading book...
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen px-6 py-10 bg-white text-gray-900">
        <div className="max-w-4xl mx-auto space-y-6">
          <button
            onClick={() => router.push("/dashboard/admin/books")}
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            <FiArrowLeft className="mr-2" /> Back to Books
          </button>

          <div className="flex flex-col md:flex-row gap-6 bg-gray-100 p-6 rounded-xl shadow-md">
            {book.cover_image_url && (
              <img
                src={book.cover_image_url}
                alt={book.title}
                className="w-40 h-56 object-cover rounded-md"
              />
            )}
            <div className="flex-1 space-y-2">
              <h1 className="text-2xl font-bold">{book.title}</h1>
              {book.description && (
                <p className="text-gray-700 whitespace-pre-line">{book.description}</p>
              )}
              <p>
                <strong>Status:</strong> {book.status || "pending"}
              </p>
              <p>
                <strong>Language:</strong> {book.language || "N/A"}
              </p>
              <p>
                <strong>Price:</strong> {book.is_free ? "Free" : book.price ? `$${book.price}` : "N/A"}
              </p>
              {book.license_type && (
                <p>
                  <strong>License:</strong> {book.license_type}
                </p>
              )}
            </div>
          </div>

          {book.tags && book.tags.length > 0 && (
            <div>
              <h2 className="font-semibold mb-1">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {book.tags.map((tag) => (
                  <span
                    key={tag.id || tag}
                    className="px-2 py-1 bg-gray-200 rounded text-sm"
                  >
                    {tag.name || tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {book.categories && book.categories.length > 0 && (
            <div>
              <h2 className="font-semibold mb-1">Categories</h2>
              <div className="flex flex-wrap gap-2">
                {book.categories.map((cat) => (
                  <span
                    key={cat.id || cat}
                    className="px-2 py-1 bg-gray-200 rounded text-sm"
                  >
                    {cat.name || cat}
                  </span>
                ))}
              </div>
            </div>
          )}

          {book.pdf_url && (
            <div>
              <a
                href={book.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                View PDF
              </a>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
