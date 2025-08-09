import { useState } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import useBookCartStore from "@/store/books/cartStore";
import useAuthStore from "@/store/auth/authStore";
import { buildUrl } from "@/services/bookService";

const buildBookItem = (b) => ({
  book_id: b.id,
  title: b.title,
  price: b.price,
  cover_url:
    b.cover_image_url ||
    buildUrl(b.cover_image) ||
    "/images/default-book-cover.jpg",
});

export default function BookDetails({ book }) {
  const router = useRouter();
  const addToCart = useBookCartStore((state) => state.addToCart);
  const { isAuthenticated, user } = useAuthStore();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = () => {
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
    addToCart(buildBookItem(book));
    toast.success("Added to cart");
    setIsAdding(false);
    router.push("/cart");
  };

  let actionButtons = null;
  if (book.is_paid) {
    if (book.user_has_access) {
      actionButtons = (
        <a
          href={book.pdf_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-6 py-3 rounded-lg bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors"
        >
          Download Book
        </a>
      );
    } else {
      actionButtons = (
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
      );
    }
  } else {
    actionButtons = (
      <a
        href={book.pdf_url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block px-6 py-3 rounded-lg bg-yellow-500 text-gray-900 font-semibold hover:bg-yellow-400 transition-colors"
      >
        Read Now
      </a>
    );
  }

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
        {book.rating != null && (
          <p className="mb-4 text-yellow-400">
            ⭐ {Number(book.rating).toFixed(1)} / 5
          </p>
        )}
        <p className="mb-6">
          {book.detailed_description || book.short_description || book.description}
        </p>

        <p className="text-xl font-semibold mb-6">
          {Number(book.price) > 0 ? `$${book.price}` : "Free"}
        </p>
        {actionButtons}
      </div>
    </div>
  );
}
