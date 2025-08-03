import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import { useTranslation } from "next-i18next";
import api from "@/services/api/api";
import BookForm from "@/components/books/BookForm";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import withAuthProtection from "@/hooks/withAuthProtection";
import { fetchBookCategories } from "@/services/bookCategoryService";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../next-i18next.config.js";

function CreateBookPage() {
  const router = useRouter();
  const { t } = useTranslation("dashboard");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchBookCategories()
      .then(setCategories)
      .catch((e) => console.error("Failed to load categories", e));
  }, []);

  const handleSubmit = async (formData) => {
    try {
      await api.post("/books", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(t("booksCreate.success"));
      router.push("/dashboard/instructor/books");
    } catch (e) {
      console.error("Failed to create book", e);
      toast.error(t("booksCreate.error"));
    }
  };

  return (
    <InstructorLayout>
      <section className="py-10 px-4 max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">{t("booksCreate.title")}</h1>
        <BookForm onSubmit={handleSubmit} categories={categories} />
      </section>
    </InstructorLayout>
  );
}

export default withAuthProtection(CreateBookPage, ["instructor"]);

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common", "dashboard"], nextI18NextConfig)),
    },
  };
}
