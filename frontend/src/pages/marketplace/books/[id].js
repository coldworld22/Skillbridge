import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { fetchBook } from "@/services/bookService";

export default function BookDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [book, setBook] = useState(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const data = await fetchBook(id);
        setBook(data);
      } catch (e) {
        console.error("Failed to load book", e);
      }
    };
    load();
  }, [id]);

  if (!book) return <p>Loading...</p>;

  return (
    <div>
      {book.cover_image_url && (
        <img
          src={book.cover_image_url}
          alt={book.title}
          className="mb-4 w-full max-w-sm"
        />
      )}
      <h1 className="text-2xl font-semibold mb-2">{book.title}</h1>
      <p className="mb-2">{book.description}</p>
      <p className="font-medium">{`$${book.price}`}</p>
    </div>
  );
}
