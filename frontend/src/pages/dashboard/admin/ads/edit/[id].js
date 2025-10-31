import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../next-i18next.config.js";
import AdminLayout from "@/components/layouts/AdminLayout";
import AdForm from "@/components/ads/AdForm";
import { fetchAdById, updateAd } from "@/services/admin/adService";
import { fetchPlanFeatures } from "@/services/planFeatureService";
import useAuthStore from "@/store/auth/authStore";

export default function EditAdPage() {
  const router = useRouter();
  const { id } = router.query;
  const { t } = useTranslation("dashboard", { keyPrefix: "adsEditPage" });
  const user = useAuthStore((s) => s.user);
  const planKey = user?.plan || "basic";

  const [planFeatures, setPlanFeatures] = useState(null);
  const [ad, setAd] = useState(null);

  useEffect(() => {
    fetchPlanFeatures("ads")
      .then(setPlanFeatures)
      .catch(() => setPlanFeatures({}));
  }, []);

  useEffect(() => {
    if (id) {
      fetchAdById(id)
        .then((data) => setAd(data))
        .catch(() => router.push("/dashboard/admin/ads"));
    }
  }, [id, router]);

  const allowBrandingEnabled =
    planFeatures?.[planKey]?.allowBranding ?? false;

  const handleSubmit = async (payload, setUploadProgress) => {
    await updateAd(id, payload, {
      onUploadProgress: (e) => {
        const percent = Math.round((e.loaded * 100) / e.total);
        setUploadProgress(percent);
      },
    });
    toast.success(t("update_success"));
    router.push("/dashboard/admin/ads");
  };

  if (!ad) {
    return (
      <AdminLayout>
        <p>Loading...</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <AdForm
        initialData={ad}
        onSubmit={handleSubmit}
        allowBrandingEnabled={allowBrandingEnabled}
        submitLabel={t("submit", { defaultValue: "Submit" })}
        tPrefix="adsEditPage"
        requireTargetRoles={false}
      />
    </AdminLayout>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["dashboard"], nextI18NextConfig)),
    },
  };
}
