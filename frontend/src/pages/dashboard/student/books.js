import { useEffect } from "react";
import BookCard from "@/components/books/BookCard";
import useLibraryStore from "@/store/library/libraryStore";
import useBookWishlistStore from "@/store/books/wishlistStore";

const buildWishlistItem = (book) => ({
  book_id: book.id,
  title: book.title,
  author: book.author,
  price: book.price,
  cover_url: book.coverUrl || "/images/default-book-cover.jpg",
});

export default function BooksPage() {
  const { books, fetchLibrary } = useLibraryStore();
  const addToWishlist = useBookWishlistStore((s) => s.addToWishlist);

  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  const handleAddToWishlist = (book) => {
    addToWishlist(buildWishlistItem(book));
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {books.map((book) => (
        <BookCard
          key={book.id}
          book={{ ...book, cover_image_url: book.coverUrl, pdf_url: book.pdfUrl }}
          showReadLink
          onAddToWishlist={() => handleAddToWishlist(book)}
        />
      ))}
    </div>
  );
}
