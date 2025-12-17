import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import { fetchBook } from "@/services/bookService";
import BookDetails from "@/components/books/BookDetails";
import BookReviewList from "@/components/books/BookReviewList";
import BookReviewForm from "@/components/books/BookReviewForm";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../next-i18next.config.js";
import useAuthStore from "@/store/auth/authStore";
import styles from "./books.module.scss";

export default function BookDetailPage() {
  const { t } = useTranslation(["website", "common"]);
  const router = useRouter();
  const { id } = router.query;
  const [book, setBook] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewVersion, setReviewVersion] = useState(0);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  const normalizedRoles = useMemo(() => {
    if (typeof isAuthenticated !== "function" || !isAuthenticated()) return [];
    const roles = [];
    if (Array.isArray(user?.roles)) roles.push(...user.roles);
    if (user?.role) roles.push(user.role);
    return roles
      .map((role) =>
        typeof role === "string" ? role.toLowerCase().trim() : null
      )
      .filter(Boolean);
  }, [isAuthenticated, user?.role, user?.roles]);

  const isAdmin = normalizedRoles.some((role) =>
    ["admin", "superadmin", "super_admin"].includes(role)
  );
  const isInstructor = normalizedRoles.some((role) =>
    ["instructor", "instructors"].includes(role)
  );

  useEffect(() => {
    if (!id) return;

    const controller = new AbortController();
    let isMounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const fetchOptions = { signal: controller.signal };
        if (isAdmin) {
          fetchOptions.admin = true;
        } else if (isInstructor) {
          fetchOptions.instructor = true;
        }
        const data = await fetchBook(id, fetchOptions);
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
  }, [id, isAdmin, isInstructor, t]);

  return (
    <section className={styles.page} style={{ position: "relative" }}>
      <div className={styles.overlay} />
      <Navbar />
      <div className={styles.container} style={{ maxWidth: "60rem" }}>
        <button
          type="button"
          onClick={() => router.back()}
          className={styles.button}
          style={{ marginBottom: "1rem", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#fbbf24" }}
        >
          {t("back_to_books")}
        </button>

        {loading && !error && (
          <div className={styles.state} style={{ color: "#fbbf24" }}>
            {t("loading")}
          </div>
        )}

        {error && (
          <div className={styles.state} style={{ color: "#f87171" }}>
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

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common", "website"], nextI18NextConfig)),
    },
  };
}
