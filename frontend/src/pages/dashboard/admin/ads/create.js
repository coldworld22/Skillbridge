import { useRouter } from "next/router";
import { toast } from "react-toastify";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../next-i18next.config.js";
import AdminLayout from "@/components/layouts/AdminLayout";
import AdForm from "@/components/ads/AdForm";
import { createAd, checkAdTitle } from "@/services/admin/adService";

export default function CreateAdPage() {
  const router = useRouter();
  const { t } = useTranslation("dashboard", { keyPrefix: "adsCreatePage" });

  const handleSubmit = async (payload, setUploadProgress) => {
    await createAd(payload, {
      onUploadProgress: (e) => {
        const percent = Math.round((e.loaded * 100) / e.total);
        setUploadProgress(percent);
      },
    });
    toast.success(t("success"));
    router.push("/dashboard/admin/ads");
  };

  return (
    <AdminLayout>
      <AdForm
        onSubmit={handleSubmit}
        allowBrandingEnabled
        checkTitle={checkAdTitle}
        submitLabel={t("submit", { defaultValue: "Submit" })}
        tPrefix="adsCreatePage"
        requireTargetRoles={false}
      />
    </AdminLayout>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["dashboard"], nextI18NextConfig)),
    },
  };
}
