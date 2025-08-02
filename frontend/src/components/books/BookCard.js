import Link from "next/link";

export default function BookCard({ book }) {
  return (
    <div className="border rounded p-4">
      {book.cover_image_url && (
        <img
          src={book.cover_image_url}
          alt={book.title}
          className="w-full h-40 object-cover mb-2"
        />
      )}
      <h3 className="font-semibold mb-1">{book.title}</h3>
      <p className="text-sm mb-2">{`$${book.price}`}</p>
      <Link href={`/marketplace/books/${book.id}`} className="text-blue-600 underline">
        View
      </Link>
    </div>
  );
}
