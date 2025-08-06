import Link from "next/link";

export default function BookCard({
  book,
  isSelected = false,
  onSelect,
  onDelete,
  onEditLink,
  showReadLink = false,
}) {
  return (
    <div className="border rounded p-4 relative">
      {onSelect && (
        <input
          type="checkbox"
          className="absolute top-2 left-2"
          checked={isSelected}
          onChange={onSelect}
        />
      )}
      {book.cover_image_url && (
        <img
          src={book.cover_image_url}
          alt={book.title}
          className="w-full h-40 object-cover mb-2"
        />
      )}
      <h3 className="font-semibold mb-1">{book.title}</h3>
      <p className="text-sm mb-2">{`$${book.price}`}</p>
      <div className="flex gap-2">
        <Link
          href={`/marketplace/books/${book.id}`}
          className="text-blue-600 underline"
        >
          View
        </Link>
        {showReadLink && book.pdf_url && (
          <a
            href={book.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            Read
          </a>
        )}
        {onEditLink && (
          <Link href={onEditLink} className="text-green-600 underline">
            Edit
          </Link>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="text-red-600 underline"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
