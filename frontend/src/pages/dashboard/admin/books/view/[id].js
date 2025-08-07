import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import AdminLayout from "@/components/layouts/AdminLayout";
import { fetchBook, deleteBook } from "@/services/bookService";
import { FiArrowLeft, FiEdit, FiTrash2 } from "react-icons/fi";
import Link from "next/link";
import toast from "react-hot-toast";

export default function AdminViewBookPage() {
  const router = useRouter();
  const { id } = router.query;
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const data = await fetchBook(id, { admin: true });
        setBook(data);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load book", err);
        setError("Failed to load book. Please try again later.");
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this book?")) return;
    try {
      await deleteBook(id);
      toast.success("Book deleted successfully");
      router.push("/dashboard/admin/books");
    } catch (err) {
      console.error("Delete failed", err);
      toast.error("Failed to delete book");
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center text-gray-600">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-gray-500" />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center text-red-600">
          {error}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Head>
        <title>View Book - Admin | SkillBridge</title>
      </Head>

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
                className="w-40 h-56 object-cover rounded-md mx-auto md:mx-0"
              />
            )}
            <div className="flex-1 space-y-2">
              <h1 className="text-2xl font-bold">{book.title}</h1>
              {book.description && (
                <p className="text-gray-700 whitespace-pre-line">{book.description}</p>
              )}
              <p><strong>Status:</strong> {book.status || "pending"}</p>
              <p><strong>Language:</strong> {book.language || "N/A"}</p>
              <p><strong>Price:</strong> {book.is_free ? "Free" : book.price ? `$${book.price}` : "N/A"}</p>
              {book.license_type && <p><strong>License:</strong> {book.license_type}</p>}
              {book.created_at && <p><strong>Created At:</strong> {new Date(book.created_at).toLocaleString()}</p>}
              {book.updated_at && <p><strong>Updated At:</strong> {new Date(book.updated_at).toLocaleString()}</p>}
              {book.uploaded_by?.name && <p><strong>Uploaded By:</strong> {book.uploaded_by.name}</p>}
            </div>
          </div>

          {book.tags && book.tags.length > 0 && (
            <div>
              <h2 className="font-semibold mb-1">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {book.tags.map((tag) => (
                  <span key={tag.id || tag} className="px-2 py-1 bg-gray-200 rounded text-sm">
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
                  <span key={cat.id || cat} className="px-2 py-1 bg-gray-200 rounded text-sm">
                    {cat.name || cat}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            {book.pdf_url && (
              <a
                href={book.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline block"
              >
                📄 View Full PDF
              </a>
            )}
            {book.preview_url && (
              <a
                href={book.preview_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline block"
              >
                🔍 View Preview Pages
              </a>
            )}
          </div>

          <div className="flex gap-4 mt-4">
            <Link href={`/dashboard/admin/books/edit/${book.id}`}>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                <FiEdit /> Edit
              </button>
            </Link>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              <FiTrash2 /> Delete
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
