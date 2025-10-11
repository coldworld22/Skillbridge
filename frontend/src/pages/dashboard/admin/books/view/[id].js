import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import AdminLayout from "@/components/layouts/AdminLayout";
import { fetchBook, deleteBook } from "@/services/bookService";
import withAuthProtection from "@/hooks/withAuthProtection";
import {
  FiArrowLeft,
  FiEdit,
  FiTrash2,
  FiFileText,
  FiEye,
  FiImage,
} from "react-icons/fi";
import Link from "next/link";
import toast from "react-hot-toast";
import ConfirmModal from "@/components/common/ConfirmModal";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../next-i18next.config.js";
import { API_BASE_URL } from "@/config/config";

function AdminViewBookPage() {
  const router = useRouter();
  const { id } = router.query;
  const { t } = useTranslation(["dashboard", "errors"]);
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  const openConfirmModal = ({ title, message, onConfirm }) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm });
  };

  const closeConfirmModal = () => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
  };

  const statusMap = {
    approved: { label: t("booksView.status.approved"), className: 'bg-green-100 text-green-800' },
    pending: { label: t("booksView.status.pending"), className: 'bg-yellow-100 text-yellow-800' },
    active: { label: t("booksView.status.active"), className: 'bg-blue-100 text-blue-800' },
    inactive: { label: t("booksView.status.inactive"), className: 'bg-gray-100 text-gray-800' },
    rejected: { label: t("booksView.status.rejected"), className: 'bg-red-100 text-red-800' },
  };

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const data = await fetchBook(id, { admin: true });
        setBook(data);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load book", err);
        setError(t("errors.bookLoad"));
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleDelete = () => {
    openConfirmModal({
      title: t("booksView.confirm_delete_title", { defaultValue: "Confirm Deletion" }),
      message: t("booksView.confirm_delete"),
      onConfirm: async () => {
        try {
          await deleteBook(id);
          toast.success(t("booksView.deleted"));
          router.push("/dashboard/admin/books");
        } catch (err) {
          console.error("Delete failed", err);
          toast.error(t("booksView.delete_failed"));
        }
      },
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md">
            {error}
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!book) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="bg-gray-100 border border-gray-300 text-gray-700 px-4 py-3 rounded max-w-md">
            {t("booksView.not_found")}
          </div>
        </div>
      </AdminLayout>
    );
  }

  const downloadUrl =
    book?.pdf_download_url ||
    book?.pdfDownloadUrl ||
    (book?.id ? `${API_BASE_URL}/library/download/${book.id}` : null);

  return (
    <AdminLayout>
      <Head>
        <title>{book.title} - Admin | SkillBridge</title>
      </Head>

      <div className="min-h-screen px-4 sm:px-6 py-8 bg-gray-50">
        <div className="max-w-5xl mx-auto space-y-6">
          <button
            onClick={() => router.push("/dashboard/admin/books")}
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200"
          >
            <FiArrowLeft className="mr-2" /> {t("booksView.back_to_books")}
          </button>

          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6">
              {book.cover_image_url ? (
                <div className="flex-shrink-0 w-full md:w-48 lg:w-56 h-64 md:h-auto">
                  <img
                    src={book.cover_image_url}
                    alt={book.title}
                    className="w-full h-full object-cover rounded-lg shadow-sm"
                  />
                </div>
              ) : (
                <div className="flex-shrink-0 w-full md:w-48 lg:w-56 h-64 md:h-auto bg-gray-100 flex items-center justify-center rounded-lg shadow-sm">
                  <FiImage className="h-16 w-16 text-gray-300" />
                </div>
              )}
              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{book.title}</h1>
                  {book.status && (
                    <span
                      className={`inline-block mt-1 px-2 py-1 text-xs font-semibold rounded-full ${
                        statusMap[book.status]?.className || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {statusMap[book.status]?.label ||
                        book.status.charAt(0).toUpperCase() + book.status.slice(1)}
                    </span>
                  )}
                </div>

                {book.description && (
                  <div className="prose max-w-none text-gray-700">
                    <p className="whitespace-pre-line">{book.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-gray-500">{t("booksView.language")}</h3>
                    <p className="text-gray-900">{book.language || t("booksView.not_specified")}</p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-medium text-gray-500">{t("booksView.price")}</h3>
                    <p className="text-gray-900">
                      {book.price === 0
                        ? t("booksView.free")
                        : book.price != null
                        ? `$${book.price.toFixed(2)}`
                        : t("booksView.not_specified")}
                    </p>
                  </div>
                  {book.license_type && (
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-gray-500">{t("booksView.license")}</h3>
                      <p className="text-gray-900">{book.license_type}</p>
                    </div>
                  )}
                  {book.uploaded_by?.name && (
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-gray-500">{t("booksView.uploaded_by")}</h3>
                      <p className="text-gray-900">{book.uploaded_by.name}</p>
                    </div>
                  )}
                  {book.created_at && (
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-gray-500">{t("booksView.created_at")}</h3>
                      <p className="text-gray-900">{new Date(book.created_at).toLocaleString()}</p>
                    </div>
                  )}
                  {book.updated_at && (
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-gray-500">{t("booksView.updated_at")}</h3>
                      <p className="text-gray-900">{new Date(book.updated_at).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {(book.tags?.length > 0 || book.categories?.length > 0) && (
              <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                <div className="flex flex-col sm:flex-row gap-6">
                  {book.tags?.length > 0 && (
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">{t("booksView.tags")}</h3>
                      <div className="flex flex-wrap gap-2">
                        {book.tags.map((tag) => (
                          <span 
                            key={tag.id || tag} 
                            className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
                          >
                            {tag.name || tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {book.categories?.length > 0 && (
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">{t("booksView.categories")}</h3>
                      <div className="flex flex-wrap gap-2">
                        {book.categories.map((cat) => (
                          <span 
                            key={cat.id || cat} 
                            className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium"
                          >
                            {cat.name || cat}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(book.pdf_url || book.preview_url) && (
              <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                <h3 className="text-sm font-medium text-gray-500 mb-3">{t("booksView.documents")}</h3>
                <div className="flex flex-wrap gap-4">
                  {downloadUrl && (
                    <a
                      href={downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors duration-200"
                    >
                      <FiFileText className="text-blue-600" />
                      <span>{t("booksView.full_pdf")}</span>
                    </a>
                  )}
                  {book.preview_url && (
                    <a
                      href={book.preview_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors duration-200"
                    >
                      <FiEye className="text-green-600" />
                      <span>{t("booksView.preview")}</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3 justify-end">
            <Link href={`/dashboard/admin/books/edit/${book.id}`}>
              <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm">
                <FiEdit size={16} /> {t("booksView.edit_book")}
              </button>
            </Link>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 shadow-sm"
            >
              <FiTrash2 size={16} /> {t("booksView.delete_book")}
            </button>
          </div>
        </div>
      </div>
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onClose={closeConfirmModal}
        onConfirm={confirmModal.onConfirm}
      />
    </AdminLayout>
  );
}

const ProtectedAdminViewBookPage = withAuthProtection(AdminViewBookPage, {
  permissions: ["manage_books"],
});
export default ProtectedAdminViewBookPage;

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common", "dashboard", "errors"], nextI18NextConfig)),
    },
  };
}
