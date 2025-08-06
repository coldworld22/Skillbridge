import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import { fetchBook } from "@/services/bookService";

export default function BookDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [book, setBook] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchBook(id);
        if (data) {
          setBook(data);
          setError(null);
        } else {
          setError("Book not found");
        }
      } catch (e) {
        console.error("Failed to load book", e);
        setError("Failed to load book");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);


  return (
    <section className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-16">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-6 text-sm text-yellow-400 hover:underline"
        >
          ← Back to books
        </button>
        {loading && !error && (
          <div className="min-h-[50vh] flex items-center justify-center text-yellow-400">
            Loading...
          </div>
        )}

        {error && (
          <div className="min-h-[50vh] flex items-center justify-center text-red-500">
            {error}
          </div>
        )}

        {!loading && !error && book && (
          <div className="flex flex-col md:flex-row gap-8 bg-gray-800/60 p-6 rounded-xl shadow-lg">
            {book.cover_image_url && (
              <img
                src={book.cover_image_url}
                alt={book.title}
                className="w-full md:w-1/3 rounded-lg object-cover"
              />
            )}

            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{book.title}</h1>
              {book.author && (
                <p className="text-yellow-400 mb-4">by {book.author}</p>
              )}
              {book.category_name && (
                <p className="text-sm uppercase tracking-wide text-gray-400 mb-4">
                  {book.category_name}
                </p>
              )}
              {book.rating && (
                <p className="mb-4 text-yellow-400">
                  ⭐ {Number(book.rating).toFixed(1)} / 5
                </p>
              )}
              <p className="mb-6">{book.description}</p>
              <p className="text-xl font-semibold mb-6">
                {book.is_paid ? `$${book.price}` : "Free"}
              </p>
              {book.pdf_url && (
                <a
                  href={book.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-6 py-3 rounded-lg bg-yellow-500 text-gray-900 font-semibold hover:bg-yellow-400 transition-colors"
                >
                  {book.is_paid ? "Preview" : "Read Now"}
                </a>
              )}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </section>
  );
}
