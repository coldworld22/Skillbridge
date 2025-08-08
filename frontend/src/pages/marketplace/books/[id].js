import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import { fetchBook } from "@/services/bookService";
import BookDetails from "@/components/books/BookDetails";

export default function BookDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [book, setBook] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const controller = new AbortController();
    let isMounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchBook(id, { signal: controller.signal });
        if (!isMounted) return;
        if (data) {
          setBook(data);
          setError(null);
        } else {
          setError("Book not found");
        }
      } catch (e) {
        if (e.name === "AbortError" || e.name === "CanceledError") return;
        console.error("Failed to load book", e);
        if (isMounted) setError("Failed to load book");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();

    return () => {
      isMounted = false;
      controller.abort();
    };
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

        {!loading && !error && book && <BookDetails book={book} />}
      </div>
      <Footer />
    </section>
  );
}
