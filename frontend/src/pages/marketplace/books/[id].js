import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import { fetchBook } from "@/services/bookService";
import BookDetails from "@/components/books/BookDetails";
import BookReviewList from "@/components/books/BookReviewList";
import BookReviewForm from "@/components/books/BookReviewForm";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../next-i18next.config.js";

export default function BookDetailPage() {
  const { t } = useTranslation(["website", "common"]);
  const router = useRouter();
  const { id } = router.query;
  const [book, setBook] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewVersion, setReviewVersion] = useState(0);

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
          setError(t("book_not_found"));
        }
      } catch (e) {
        if (e.name === "AbortError" || e.name === "CanceledError") return;
        console.error("Failed to load book", e);
        if (isMounted) setError(t("failed_load_book"));
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [id, t]);

  return (
    <section className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-16">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-6 text-sm text-yellow-400 hover:underline"
        >
          {t("back_to_books")}
        </button>

        {loading && !error && (
          <div className="min-h-[50vh] flex items-center justify-center text-yellow-400">
            {t("loading")}
          </div>
        )}

        {error && (
          <div className="min-h-[50vh] flex items-center justify-center text-red-500">
            {error}
          </div>
        )}

        {!loading && !error && book && (
          <>
            <BookDetails book={book} />
            <BookReviewList bookId={id} version={reviewVersion} />
            <BookReviewForm
              bookId={id}
              onSubmitted={() => setReviewVersion((v) => v + 1)}
            />
          </>
        )}
      </div>
      <Footer />
    </section>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common", "website"], nextI18NextConfig)),
    },
  };
}

export async function getStaticPaths() {
  return {
    paths: [],
    fallback: "blocking",
  };
}
