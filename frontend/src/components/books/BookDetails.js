import { useRouter } from "next/router";
import { useState } from "react";
import { toast } from "react-toastify";
import useCartStore from "@/store/cart/cartStore";
import useAuthStore from "@/store/auth/authStore";

export default function BookDetails({ book }) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const { isAuthenticated, user } = useAuthStore();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async () => {
    if (!isAuthenticated()) {
      toast.info("Please log in to purchase");
      router.push("/auth/login");
      return;
    }
    if (user?.role?.toLowerCase() !== "student") {
      toast.error("Only students can purchase books");
      return;
    }
    setIsAdding(true);
    try {
      await addItem({ id: book.id, name: book.title, price: book.price });
      toast.success("Added to cart");
      router.push("/cart");
    } catch (err) {
      console.error("Failed to add to cart", err);
      toast.error("Failed to add to cart");
    } finally {
      setIsAdding(false);
    }
  };

  return (
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
          <p className="text-sm uppercase tracking-wide text-gray-400 mb-2">
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
          <>
            {book.is_paid ? (
              book.user_has_access ? (
                <a
                  href={book.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-6 py-3 rounded-lg bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors"
                >
                  Download Book
                </a>
              ) : (
                <div className="flex flex-wrap gap-4">
                  {book.preview_url && (
                    <a
                      href={book.preview_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-6 py-3 rounded-lg bg-yellow-500 text-gray-900 font-semibold hover:bg-yellow-400 transition-colors"
                    >
                      Preview
                    </a>
                  )}
                  <button
                    onClick={handleAddToCart}
                    disabled={isAdding}
                    className="inline-block px-6 py-3 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add to Cart
                  </button>
                </div>
              )
            ) : (
              <a
                href={book.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-3 rounded-lg bg-yellow-500 text-gray-900 font-semibold hover:bg-yellow-400 transition-colors"
              >
                Read Now
              </a>
            )}
          </>
        )}
      </div>
    </div>
  );
}

