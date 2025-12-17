import { useRouter } from "next/router";
import { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../next-i18next.config.js";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import AdForm from "@/components/ads/AdForm";
import { createAd, fetchAds as fetchInstructorAds } from "@/services/admin/adService";
import { fetchPlanFeatures } from "@/services/planFeatureService";
import useAuthStore from "@/store/auth/authStore";

export default function CreateAdPage() {
  const router = useRouter();
  const { t, i18n } = useTranslation("dashboard", { keyPrefix: "adsCreatePage" });
  const user = useAuthStore((s) => s.user);
  const rawPlanKey =
    user?.plan_slug || user?.plan?.slug || user?.plan || "basic";
  const [planFeatures, setPlanFeatures] = useState(null);
  const [isPlanLoading, setIsPlanLoading] = useState(true);
  const [planFetchError, setPlanFetchError] = useState(false);
  const [activeAdsCount, setActiveAdsCount] = useState(null);
  const [isLoadingAds, setIsLoadingAds] = useState(false);
  const [adsLimitError, setAdsLimitError] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetchPlanFeatures("ads")
      .then((data) => {
        if (!mounted) return;
        setPlanFeatures(data);
        setPlanFetchError(false);
      })
      .catch(() => {
        if (!mounted) return;
        setPlanFeatures({});
        setPlanFetchError(true);
      })
      .finally(() => {
        if (!mounted) return;
        setIsPlanLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

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

  const maxAds = toNumberOrNull(currentPlanFeatures?.maxAds);
  const maxAdDuration = toNumberOrNull(currentPlanFeatures?.maxAdDuration);
  const hasDurationLimit =
    typeof maxAdDuration === "number" &&
    Number.isFinite(maxAdDuration) &&
    maxAdDuration > 0;

  useEffect(() => {
    if (isPlanLoading) return;
    if (!user?.id || maxAds === null) {
      setActiveAdsCount(null);
      setAdsLimitError(false);
      setIsLoadingAds(false);
      return;
    }
    setIsLoadingAds(true);
    fetchInstructorAds({ limit: 1, status: "active" })
      .then((res) => {
        const total = res?.meta?.total ?? res?.data?.length ?? 0;
        setActiveAdsCount(total);
        setAdsLimitError(false);
      })
      .catch(() => {
        setActiveAdsCount(null);
        setAdsLimitError(true);
      })
      .finally(() => setIsLoadingAds(false));
  }, [isPlanLoading, user?.id, maxAds]);

  const planLimitReached =
    maxAds !== null &&
    typeof activeAdsCount === "number" &&
    activeAdsCount >= maxAds;
  const isAwaitingLimitCheck =
    !isPlanLoading &&
    maxAds !== null &&
    (isLoadingAds || activeAdsCount === null) &&
    !adsLimitError;

  const durationPreset = useMemo(() => {
    if (!hasDurationLimit) return null;
    const start = new Date();
    const end = new Date(start.getTime() + maxAdDuration * 24 * 60 * 60 * 1000);
    return {
      startAt: start.toISOString().split("T")[0],
      endAt: end.toISOString().split("T")[0],
    };
  }, [hasDurationLimit, maxAdDuration]);

  const formattedSchedule = useMemo(() => {
    if (!durationPreset) return null;
    try {
      const formatter = new Intl.DateTimeFormat(i18n.language || "en", {
        dateStyle: "medium",
      });
      return {
        start: formatter.format(new Date(durationPreset.startAt)),
        end: formatter.format(new Date(durationPreset.endAt)),
      };
    } catch {
      return {
        start: durationPreset.startAt,
        end: durationPreset.endAt,
      };
    }
  }, [durationPreset, i18n.language]);

  const initialData = durationPreset ?? {};
  const showLimitError = planFetchError || adsLimitError;

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
      <div className="p-6 space-y-6">
        {currentPlanFeatures && (maxAds !== null || hasDurationLimit) && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl px-5 py-4">
            <ul className="list-disc pl-6 space-y-1 text-sm text-blue-900 dark:text-blue-200">
              {maxAds !== null && (
                <li>
                  {t("plan_limit_ads", {
                    current:
                      typeof activeAdsCount === "number" ? activeAdsCount : "—",
                    count: maxAds,
                  })}
                </li>
              )}
              {maxAdDuration !== null && (
                <li>{t("plan_limit_duration", { days: maxAdDuration })}</li>
              )}
            </ul>
          </div>
        )}

        {showLimitError && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl px-4 py-3 text-sm text-yellow-900 dark:text-yellow-100">
            {t("limit_load_failed", {
              defaultValue: "Unable to verify your ad limits right now. Please try again shortly.",
            })}
          </div>
        )}

        {isPlanLoading ? (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-6 py-10 text-center text-gray-600 dark:text-gray-300">
            {t("loading_plan_limits", {
              defaultValue: "Loading your plan limits...",
            })}
          </div>
        ) : isAwaitingLimitCheck ? (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-6 py-10 text-center text-gray-600 dark:text-gray-300">
            {t("checking_plan_limits", {
              defaultValue: "Checking your plan limits...",
            })}
          </div>
        ) : planLimitReached ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl px-6 py-8 text-center text-red-900 dark:text-red-100 space-y-3">
            <h2 className="text-xl font-semibold">
              {t("ad_limit_reached", { count: maxAds })}
            </h2>
            <p className="text-sm">
              {t("manage_ads_prompt", {
                defaultValue: "Please deactivate an existing ad or upgrade your plan to create new ads.",
              })}
            </p>
          </div>
        ) : (
          <>
            {hasDurationLimit && formattedSchedule && (
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-xl px-5 py-4 space-y-1">
                <p className="text-sm text-purple-900 dark:text-purple-100">
                  {t("auto_duration_hint", { days: maxAdDuration })}
                </p>
                <p className="text-xs text-purple-800 dark:text-purple-200">
                  {t("auto_duration_schedule", {
                    start: formattedSchedule.start,
                    end: formattedSchedule.end,
                  })}
                </p>
              </div>
            )}

            <AdForm
              initialData={initialData}
              onSubmit={handleSubmit}
              allowBrandingEnabled={allowBrandingEnabled}
              submitLabel={t("create_ad", { defaultValue: "Create Advertisement" })}
              tPrefix="adsCreatePage"
              maxDurationDays={maxAdDuration}
            />
          </>
        )}
      </div>
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
