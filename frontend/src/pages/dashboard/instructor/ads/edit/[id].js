import { useRouter } from "next/router";
import { useEffect, useState, useMemo } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../next-i18next.config.js";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import AdForm from "@/components/ads/AdForm";
import { fetchAdById, updateAd } from "@/services/admin/adService";
import { fetchPlanFeatures } from "@/services/planFeatureService";
import useAuthStore from "@/store/auth/authStore";

export default function EditAdPage() {
  const router = useRouter();
  const { id } = router.query;
  const { t } = useTranslation("dashboard", { keyPrefix: "adsEditPage" });
  const user = useAuthStore((s) => s.user);
  const rawPlanKey =
    user?.plan_slug || user?.plan?.slug || user?.plan || "basic";
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
        .catch(() => router.push("/dashboard/instructor/ads"));
    }
  }, [id, router]);

  const canonicalize = (value) =>
    value?.toString().toLowerCase().replace(/[^a-z0-9]/g, "") || "";

  const currentPlanFeatures = useMemo(() => {
    if (!planFeatures) return null;
    const entries = Object.entries(planFeatures);
    if (!entries.length) return null;

    if (typeof rawPlanKey === "string" && rawPlanKey.trim()) {
      const direct = planFeatures[rawPlanKey];
      if (direct) return direct;
      const lower = planFeatures[rawPlanKey.toLowerCase()];
      if (lower) return lower;
      const canonicalKey = canonicalize(rawPlanKey);
      const match = entries.find(
        ([slug]) => canonicalize(slug) === canonicalKey
      );
      if (match) return match[1];
    }

    if (planFeatures.basic) return planFeatures.basic;
    const firstEntry = entries.find(([, value]) => value);
    return firstEntry ? firstEntry[1] : null;
  }, [planFeatures, rawPlanKey]);

  const toNumberOrNull = (value) => {
    if (value === null || value === undefined) return null;
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  };

  const allowBrandingEnabled =
    currentPlanFeatures?.allowBranding ?? false;
  const maxAdDuration = toNumberOrNull(currentPlanFeatures?.maxAdDuration);

  const handleSubmit = async (payload, setUploadProgress) => {
    await updateAd(id, payload, {
      onUploadProgress: (e) => {
        const percent = Math.round((e.loaded * 100) / e.total);
        setUploadProgress(percent);
      },
    });
    toast.success(t("update_success"));
    router.push("/dashboard/instructor/ads");
  };

  if (!ad) {
    return (
      <InstructorLayout>
        <p>Loading...</p>
      </InstructorLayout>
    );
  }

  return (
    <InstructorLayout>
      <AdForm
        initialData={ad}
        onSubmit={handleSubmit}
        allowBrandingEnabled={allowBrandingEnabled}
        submitLabel={t("submit", { defaultValue: "Submit" })}
        tPrefix="adsEditPage"
        maxDurationDays={maxAdDuration}
      />
    </InstructorLayout>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["dashboard"], nextI18NextConfig)),
    },
  };
}
