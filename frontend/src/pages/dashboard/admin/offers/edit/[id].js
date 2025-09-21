import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import AdminLayout from "@/components/layouts/AdminLayout";
import { fetchOfferById, updateOffer } from "@/services/admin/offerService";
import withAuthProtection from "@/hooks/withAuthProtection";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../next-i18next.config.js";

const formatTags = (tags) => {
  if (!tags) return "";

  if (Array.isArray(tags)) {
    return tags
      .map((tag) => {
        if (typeof tag === "string") return tag;
        if (tag && typeof tag === "object") return tag.name || "";
        return "";
      })
      .filter(Boolean)
      .join(", ");
  }

  if (typeof tags === "string") {
    try {
      const parsed = JSON.parse(tags);
      if (Array.isArray(parsed)) {
        return parsed.filter(Boolean).join(", ");
      }
    } catch (_) {
      return tags;
    }
  }

  return "";
};

const AdminEditOfferPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { t } = useTranslation("dashboard");

  const [form, setForm] = useState({
    title: "",
    price: "",
    duration: "",
    tags: "",
    description: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    setError("");

    fetchOfferById(id)
      .then((offerData) => {
        if (!offerData) {
          const message = t("adminOfferEditPage.load_failed");
          setError(message);
          toast.error(message);
          return;
        }

        setForm({
          title: offerData.title || "",
          price: offerData.budget || "",
          duration: offerData.timeframe || "",
          tags: formatTags(offerData.tags),
          description: offerData.description || "",
        });
      })
      .catch(() => {
        const message = t("adminOfferEditPage.load_failed");
        setError(message);
        toast.error(message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id, t]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!id) return;

    setIsSubmitting(true);

    const payload = {
      title: form.title,
      description: form.description,
      budget: form.price,
      timeframe: form.duration,
      tags: JSON.stringify(
        form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      ),
    };

    try {
      await updateOffer(id, payload);
      toast.success(t("adminOfferEditPage.update_success"));
      router.push("/dashboard/admin/offers");
    } catch (_) {
      toast.error(t("adminOfferEditPage.update_failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 text-gray-600">{t("adminOfferEditPage.loading")}</div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow mt-10 mb-10">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        {t("adminOfferEditPage.heading")}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block font-medium mb-1">
            {t("adminOfferEditPage.title_label")}
          </label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded px-4 py-2"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">
            {t("adminOfferEditPage.price_label")}
          </label>
          <input
            name="price"
            value={form.price}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded px-4 py-2"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">
            {t("adminOfferEditPage.duration_label")}
          </label>
          <input
            name="duration"
            value={form.duration}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded px-4 py-2"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">
            {t("adminOfferEditPage.tags_label")}
          </label>
          <input
            name="tags"
            value={form.tags}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-4 py-2"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">
            {t("adminOfferEditPage.description_label")}
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            className="w-full border border-gray-300 rounded px-4 py-2"
          ></textarea>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded font-semibold ${
              isSubmitting ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {isSubmitting
              ? t("adminOfferEditPage.saving")
              : t("adminOfferEditPage.save")}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="text-gray-600 underline"
            disabled={isSubmitting}
          >
            {t("adminOfferEditPage.cancel")}
          </button>
        </div>
      </form>
    </div>
  );
};

const ProtectedAdminEditOfferPage = withAuthProtection(AdminEditOfferPage, [
  "admin",
  "superadmin",
]);

ProtectedAdminEditOfferPage.getLayout = (page) => (
  <AdminLayout>{page}</AdminLayout>
);

export default ProtectedAdminEditOfferPage;

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(
        locale,
        ["common", "dashboard"],
        nextI18NextConfig
      )),
    },
  };
}
