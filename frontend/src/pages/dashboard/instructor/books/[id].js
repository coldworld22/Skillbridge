import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import {
  FiArrowLeft,
  FiDownload,
  FiEye,
  FiFileText,
  FiTag,
} from "react-icons/fi";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

import withAuthProtection from "@/hooks/withAuthProtection";
import { fetchBook } from "@/services/bookService";
import { formatCurrency } from "@/utils/currency";
import { API_BASE_URL } from "@/config/config";
import nextI18NextConfig from "../../../../../next-i18next.config.js";
import InstructorLayout from "@/components/layouts/InstructorLayout";

function InstructorBookDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { t } = useTranslation(["dashboard", "errors"]);
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    const controller = new AbortController();
    const loadBook = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchBook(id, {
          admin: true,
          signal: controller.signal,
        });
        if (!data) {
          setError(t("booksView.not_found"));
          setBook(null);
        } else {
          setBook(data);
        }
      } catch (err) {
        if (err.name === "CanceledError" || err.name === "AbortError") {
          return;
        }
        console.error("Failed to load book", err);
        setError(t("errors:bookLoad"));
      } finally {
        setLoading(false);
      }
    };

    loadBook();

    return () => controller.abort();
  }, [id, t]);

  const statusPill = useMemo(() => {
    if (!book?.status) return null;
    const statusMap = {
      approved: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      active: "bg-blue-100 text-blue-800",
      inactive: "bg-gray-100 text-gray-800",
      rejected: "bg-red-100 text-red-800",
    };

    return (
      <span
        className={`inline-block mt-1 px-2 py-1 text-xs font-semibold rounded-full ${
          statusMap[book.status] || "bg-gray-100 text-gray-800"
        }`}
      >
        {t(`booksView.status.${book.status}`, {
          defaultValue:
            book.status.charAt(0).toUpperCase() + book.status.slice(1),
        })}
      </span>
    );
  }, [book?.status, t]);

  const downloadUrl =
    book?.pdf_download_url ||
    book?.pdfDownloadUrl ||
    (book?.id ? `${API_BASE_URL}/library/download/${book.id}` : null);

  const previewUrl = book?.preview_url || null;
  const formattedPrice = useMemo(() => {
    if (book?.price === 0 || book?.price === "0") {
      return t("booksView.free");
    }
    if (book?.price != null) {
      return formatCurrency(book.price);
    }
    return t("booksView.not_specified");
  }, [book?.price, t]);

  const createdAt = book?.created_at || book?.createdAt;
  const updatedAt = book?.updated_at || book?.updatedAt;
  const tags = useMemo(
    () =>
      Array.isArray(book?.tags)
        ? book.tags
        : typeof book?.tags === "string"
        ? book.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
        : [],
    [book?.tags]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
          <p className="font-semibold">{error}</p>
          <button
            type="button"
            onClick={() => router.replace(router.asPath)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
          >
            {t("booksPage.retry")}
          </button>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md rounded-xl border border-gray-200 bg-white p-6 text-center text-gray-600">
          {t("booksView.not_found")}
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{`${book.title} | ${t("books")}`}</title>
      </Head>

      <section className="px-4 py-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          <button
            type="button"
            onClick={() => router.push("/dashboard/instructor/books")}
            className="inline-flex items-center gap-2 text-blue-600 transition hover:text-blue-800"
          >
            <FiArrowLeft /> {t("booksView.back_to_books")}
          </button>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-col gap-6 p-6 md:flex-row">
              <div className="mx-auto w-full max-w-xs flex-shrink-0">
                {book.cover_image_url ? (
                  <Image
                    src={book.cover_image_url}
                    alt={book.title}
                    width={320}
                    height={460}
                    className="h-full w-full rounded-xl object-cover shadow"
                  />
                ) : (
                  <div className="flex h-full min-h-[360px] w-full items-center justify-center rounded-xl bg-gray-100 text-gray-400">
                    <FiFileText className="text-4xl" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{book.title}</h1>
                  {statusPill}
                </div>

                {book.author && (
                  <p className="text-sm uppercase tracking-wide text-gray-500">
                    {t("booksPage.by_author", { author: book.author })}
                  </p>
                )}

                {book.description && (
                  <p className="text-gray-700">{book.description}</p>
                )}

                <div className="grid grid-cols-1 gap-4 rounded-xl bg-gray-50 p-4 sm:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">{t("booksView.price")}</h3>
                    <p className="text-base font-semibold text-gray-900">{formattedPrice}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">{t("booksView.language")}</h3>
                    <p className="text-base text-gray-900">{book.language || t("booksView.not_specified")}</p>
                  </div>
                  {book.license_type && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">{t("booksView.license")}</h3>
                      <p className="text-base text-gray-900">{book.license_type}</p>
                    </div>
                  )}
                  {book.category_name && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">{t("booksView.categories")}</h3>
                      <p className="text-base text-gray-900">{book.category_name}</p>
                    </div>
                  )}
                  {createdAt && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">{t("booksView.created_at")}</h3>
                      <p className="text-base text-gray-900">
                        {new Date(createdAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {updatedAt && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">{t("booksView.updated_at")}</h3>
                      <p className="text-base text-gray-900">
                        {new Date(updatedAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                {tags.length > 0 && (
                  <div>
                    <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-500">
                      <FiTag /> {t("booksView.tags")}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-3 pt-4">
                  {downloadUrl && (
                    <a
                      href={downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                    >
                      <FiDownload /> {t("booksView.full_pdf")}
                    </a>
                  )}
                  {previewUrl && (
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:text-blue-800"
                    >
                      <FiEye /> {t("booksView.preview")}
                    </a>
                  )}
                  {downloadUrl && (
                    <Link
                      href={downloadUrl}
                      target="_blank"
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:text-gray-900"
                    >
                      <FiFileText /> {t("booksView.documents")}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

const ProtectedInstructorBookDetailPage = withAuthProtection(InstructorBookDetailPage, ["instructor"]);

ProtectedInstructorBookDetailPage.getLayout = (page) => <InstructorLayout>{page}</InstructorLayout>;

export default ProtectedInstructorBookDetailPage;

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["dashboard", "errors"], nextI18NextConfig)),
    },
  };
}
