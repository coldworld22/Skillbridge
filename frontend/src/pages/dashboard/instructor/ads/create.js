import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../next-i18next.config.js";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import AdForm from "@/components/ads/AdForm";
import { createAd } from "@/services/admin/adService";
import { fetchPlanFeatures } from "@/services/planFeatureService";
import useAuthStore from "@/store/auth/authStore";

export default function CreateAdPage() {
  const router = useRouter();
  const { t } = useTranslation("dashboard", { keyPrefix: "adsCreatePage" });
  const user = useAuthStore((s) => s.user);
  const planKey = user?.plan || "basic";
  const [planFeatures, setPlanFeatures] = useState(null);

  useEffect(() => {
    fetchPlanFeatures("ads")
      .then(setPlanFeatures)
      .catch(() => setPlanFeatures({}));
  }, []);

  const allowBrandingEnabled =
    planFeatures?.[planKey]?.allowBranding ?? false;

  const handleSubmit = async (payload, setUploadProgress) => {
    await createAd(payload, {
      onUploadProgress: (e) => {
        const percent = Math.round((e.loaded * 100) / e.total);
        setUploadProgress(percent);
      },
    });
    toast.success(t("success"));
    router.push("/dashboard/instructor/ads");
  };

  return (
    <InstructorLayout>
      <AdForm
        onSubmit={handleSubmit}
        allowBrandingEnabled={allowBrandingEnabled}
        submitLabel={t("submit", { defaultValue: "Submit" })}
        tPrefix="adsCreatePage"
      />
    </InstructorLayout>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["dashboard"], nextI18NextConfig)),
    },
  };
}
