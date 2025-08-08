import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import { fetchBook } from "@/services/bookService";
import { purchaseBook } from "@/services/checkoutService";
import useLibraryStore from "@/store/library/libraryStore";

export default function BookCheckoutPage() {
  const router = useRouter();
  const { id } = router.query;
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const fetchLibrary = useLibraryStore((state) => state.fetchLibrary);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const data = await fetchBook(id);
        setBook(data);
        setError("");
      } catch (e) {
        console.error("Failed to load book", e);
        setError("Failed to load book");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handlePurchase = async () => {
    if (!id) return;
    setProcessing(true);
    try {
      await purchaseBook(id);
      await fetchLibrary();
      router.push("/cart/confirmation");
    } catch (e) {
      console.error("Failed to purchase", e);
      setError("Payment failed");
      setProcessing(false);
    }
  };

  if (loading) return <div className="text-white text-center mt-32">Loading...</div>;
  if (error) return <div className="text-white text-center mt-32">{error}</div>;
  if (!book) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-white">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-20 mt-16">
        <h1 className="text-3xl font-bold mb-6 text-yellow-400">Checkout</h1>
        <div className="bg-gray-800 p-6 rounded-xl shadow-md mb-6 flex gap-6 items-center">
          {book.cover_image_url && (
            <img
              src={book.cover_image_url}
              alt={book.title}
              className="w-32 h-32 object-cover rounded-lg"
            />
          )}
          <div>
            <h2 className="text-xl font-semibold">{book.title}</h2>
            {book.author && (
              <p className="text-sm text-gray-400">by {book.author}</p>
            )}
            <p className="mt-2 font-bold text-lg">Price: ${book.price}</p>
          </div>
        </div>
        <button
          onClick={handlePurchase}
          disabled={processing}
          className="w-full py-3 bg-yellow-500 text-gray-900 font-bold rounded hover:bg-yellow-600 transition-all"
        >
          {processing ? "Processing..." : "Pay Now"}
        </button>
      </main>
      <Footer />
    </div>
  );
}
