import { useEffect } from "react";
import { FiDownload, FiEye, FiStar, FiHeart } from "react-icons/fi";
import useLibraryStore from "@/store/library/libraryStore";

function BookCard({ book }) {
  const cover = book.coverUrl || "/images/default-book-cover.jpg";

  return (
    <div className="border rounded-xl shadow-sm p-4 bg-white flex flex-col justify-between h-full">
      <img
        src={cover}
        alt={book.title}
        className="w-full h-48 object-cover rounded-lg mb-4"
      />
      <div className="flex-1">
        <h3 className="text-lg font-semibold mb-1 line-clamp-2">{book.title}</h3>
        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{book.shortDescription}</p>
        <p className="text-sm text-gray-500 mb-1">By {book.author}</p>
        <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-3">
          {book.tags?.map((tag, idx) => (
            <span key={idx} className="bg-gray-100 px-2 py-0.5 rounded">
              {tag}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm">
          {book.isFree ? (
            <span className="text-green-600 font-medium">Free</span>
          ) : (
            <span className="text-blue-600 font-medium">Purchased for ${book.price}</span>
          )}
        </div>
        {book.purchasedAt && (
          <p className="text-xs text-gray-400 mt-1">Purchased on {new Date(book.purchasedAt).toLocaleDateString()}</p>
        )}
      </div>
      <div className="mt-4 flex gap-3 flex-wrap">
        {book.previewUrl && (
          <a
            href={book.previewUrl}
            target="_blank"
            className="flex items-center gap-1 text-indigo-600 hover:underline"
          >
            <FiEye className="text-lg" /> Preview
          </a>
        )}
        {book.pdfUrl && (
          <a
            href={book.pdfUrl}
            target="_blank"
            download
            className="flex items-center gap-1 text-green-600 hover:underline"
          >
            <FiDownload className="text-lg" /> Download
          </a>
        )}
        <button className="text-yellow-500 hover:text-yellow-600">
          <FiStar />
        </button>
        <button className="text-red-400 hover:text-red-500">
          <FiHeart />
        </button>
      </div>
    </div>
  );
}

export default function BooksPage() {
  const { books, fetchLibrary } = useLibraryStore();

  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {books.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  );
}
