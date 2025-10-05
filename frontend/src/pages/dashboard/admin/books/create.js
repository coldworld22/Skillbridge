import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import { useTranslation } from "next-i18next";
import { createBook } from "@/services/bookService";
import BookForm from "@/components/books/BookForm";
import AdminLayout from "@/components/layouts/AdminLayout";
import withAuthProtection from "@/hooks/withAuthProtection";
import { fetchAllCategories } from "@/services/admin/categoryService";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../next-i18next.config.js";
import useNotificationStore from "@/store/notifications/notificationStore";
import useMessageStore from "@/store/messages/messageStore";
import { FiArrowLeft, FiX } from "react-icons/fi";
import Head from "next/head";
import useCoverImageUpload from "@/hooks/useCoverImageUpload";
import { MAX_IMAGE_SIZE_MB } from "@/utils/constants";

function AdminCreateBookPage() {
  const router = useRouter();
  const { t } = useTranslation(["common", "dashboard", "validation", "errors"]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  const {
    coverPreview,
    fileError,
    fileInputRef,
    handleFileChange,
    handleRemoveImage,
  } = useCoverImageUpload(t);

  const fetchNotifications = useNotificationStore((state) => state.fetch);
  const fetchMessages = useMessageStore((state) => state.fetch);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setIsLoading(true);
        const result = await fetchAllCategories();
        setCategories(result?.data || result || []);
      } catch (err) {
        console.error("Failed to load categories", err);
        setError(t("errors:categoryLoad"));
        toast.error(t("errors:categoryLoad"));
      } finally {
        setIsLoading(false);
      }
    };

    loadCategories();
  }, [t]);

  const handleSubmit = async (formData, setProgress) => {
    if (fileInputRef.current?.files?.[0]) {
      formData.append("cover_image", fileInputRef.current.files[0]);
    }
    try {
      setProgress(0);
      await createBook(formData, (event) => {
        if (event.total) {
          const progress = Math.round((event.loaded * 100) / event.total);
          setProgress(progress);
          setUploadProgress(progress);
        }
      });

      toast.success(t("booksCreate.success"));

      try {
        await Promise.all([fetchNotifications(), fetchMessages()]);
      } catch (notifyErr) {
        console.error("Failed to refresh notifications or messages", notifyErr);
      }
      handleRemoveImage();
      router.push("/dashboard/admin/books");
    } catch (err) {
      console.error("Failed to create book", err);
      let errorMessage = t("booksCreate.error");
      if (err.response) {
        const respErrors = err.response.data?.errors;
        if (respErrors) {
          if (Array.isArray(respErrors)) {
            errorMessage = respErrors
              .map((e) => e?.message || e?.msg || e)
              .join(", ");
          } else {
            errorMessage = Object.values(respErrors).join(", ");
          }
        } else if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        }
      }
      toast.error(errorMessage);
    } finally {
      setProgress(null);
      setUploadProgress(null);
    }
  };

  const handleCancel = () => {
    handleRemoveImage();
    router.push("/dashboard/admin/books");
  };

  return (
    <AdminLayout>
      <Head>
        <title>{t("booksCreate.pageTitle")} | {t("common.adminPanel")}</title>
      </Head>

      <section className="py-8 px-4 max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={handleCancel}
            className="flex items-center text-primary hover:text-primary-dark transition-colors"
          >
            <FiArrowLeft className="mr-2" />
            {t("common.backToList")}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            {t("booksCreate.title")}
          </h1>

          {error ? (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          ) : isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="cover_image" className="block text-sm font-medium text-gray-700">
                  {t("booksCreate.coverImage")}
                </label>

                {coverPreview ? (
                  <div className="relative group">
                    <div className="w-64 h-64 rounded-md overflow-hidden border border-gray-200">
                      <img
                        src={coverPreview}
                        alt="Cover preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label={t("common.removeImage")}
                    >
                      <FiX className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <div className="flex text-sm text-gray-600 justify-center">
                        <label
                          htmlFor="cover_image"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-dark focus-within:outline-none"
                        >
                          <span>{t("booksCreate.uploadImage")}</span>
                          <input
                            id="cover_image"
                            name="cover_image"
                            type="file"
                            className="sr-only"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/jpeg, image/png, image/webp"
                          />
                        </label>
                      </div>
                      <p className="text-xs text-gray-500">
                        {t("booksCreate.imageRequirements", {
                          size: `${MAX_IMAGE_SIZE_MB}MB`,
                        })}
                      </p>
                    </div>
                  </div>
                )}

                {fileError && (
                  <p className="mt-2 text-sm text-red-600">{fileError}</p>
                )}
              </div>

              {uploadProgress !== null && (
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}

              <BookForm
                onSubmit={handleSubmit}
                categories={categories}
                showCoverImage={false}
                submitText={t("booksCreate.save")}
                cancelText={t("common.cancel")}
                onCancel={handleCancel}
              />
            </div>
          )}
        </div>
      </section>
    </AdminLayout>
  );
}

const ProtectedAdminCreateBookPage = withAuthProtection(AdminCreateBookPage, {
  permissions: ["manage_books"],
});
export default ProtectedAdminCreateBookPage;

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(
        locale,
        ["common", "dashboard", "validation", "errors"],
        nextI18NextConfig
      )),
    },
  };
}
