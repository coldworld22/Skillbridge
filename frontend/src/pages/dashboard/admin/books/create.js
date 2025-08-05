import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import { useTranslation } from "next-i18next";
import api from "@/services/api/api";
import BookForm from "@/components/books/BookForm";
import AdminLayout from "@/components/layouts/AdminLayout";
import withAuthProtection from "@/hooks/withAuthProtection";
import { fetchBookCategories } from "@/services/bookCategoryService";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../next-i18next.config.js";
import useNotificationStore from "@/store/notifications/notificationStore";
import useMessageStore from "@/store/messages/messageStore";

function AdminCreateBookPage() {
  const router = useRouter();
  const { t } = useTranslation("dashboard");
  const [categories, setCategories] = useState([]);
  const fetchNotifications = useNotificationStore((state) => state.fetch);
  const fetchMessages = useMessageStore((state) => state.fetch);

  useEffect(() => {
    fetchBookCategories()
      .then(setCategories)
      .catch((e) => console.error("Failed to load categories", e));
  }, []);

  const handleSubmit = async (formData, setProgress) => {
    try {
      await api.post("/books", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (event) => {
          if (event.total) {
            const progress = Math.round((event.loaded * 100) / event.total);
            setProgress(progress);
          }
        },
      });
      toast.success(t("booksCreate.success"));
      fetchNotifications();
      fetchMessages();
      router.push("/dashboard/admin/books");
    } catch (e) {
      console.error("Failed to create book", e);
      toast.error(t("booksCreate.error"));
    } finally {
      setProgress(null);
    }
  };

  return (
    <AdminLayout>
      <section className="py-10 px-4 max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">{t("booksCreate.title")}</h1>
        <BookForm onSubmit={handleSubmit} categories={categories} />
      </section>
    </AdminLayout>
  );
}

export default withAuthProtection(AdminCreateBookPage, ["admin", "superadmin"]);

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common", "dashboard"], nextI18NextConfig)),
    },
  };
}

