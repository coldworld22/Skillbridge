import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import withAuthProtection from "@/hooks/withAuthProtection";
import { fetchBook } from "@/services/bookService";

function InstructorBookDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [book, setBook] = useState(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const data = await fetchBook(id, { admin: true });
        setBook(data);
      } catch (e) {
        console.error("Failed to load book", e);
      }
    };
    load();
  }, [id]);

  return (
    <InstructorLayout>
      <section className="py-10 px-4 max-w-3xl mx-auto">
        {!book ? (
          <p>Loading...</p>
        ) : (
          <>
            {book.cover_image_url && (
              <img
                src={book.cover_image_url}
                alt={book.title}
                className="mb-4 w-full max-w-sm"
              />
            )}
            <h1 className="text-2xl font-semibold mb-2">{book.title}</h1>
            {book.description && <p className="mb-2">{book.description}</p>}
            <p className="font-medium">{`$${book.price}`}</p>
          </>
        )}
      </section>
    </InstructorLayout>
  );
}

export default withAuthProtection(InstructorBookDetailPage, ["instructor"]);
