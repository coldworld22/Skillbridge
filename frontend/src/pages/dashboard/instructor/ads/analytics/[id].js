// pages/instructor/ads/analytics/[id].js
import Link from "next/link";
import { useRouter } from "next/router";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import { useEffect, useState } from "react";
import PageHead from "@/components/common/PageHead";
import { fetchAdById, fetchAdAnalytics } from "@/services/admin/adService";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, ResponsiveContainer
} from "recharts";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../next-i18next.config.js";
import { ensureAdLifecycle } from "@/utils/ads/lifecycle";
import {
  describeAdLifecycle,
  getAdStatusClasses,
  getAdStatusLabel,
} from "@/utils/ads/presentation";
import badgeStyles from "@/styles/components/statusBadges.module.scss";
import styles from "../../../ads/ads-analytics.module.scss";

export default function InstructorAdAnalyticsPage() {
  const { t } = useTranslation("dashboard", { keyPrefix: "adsAnalyticsPage" });
  const { t: tp } = useTranslation("dashboard", { keyPrefix: "adsPage" });
  const router = useRouter();
  const { id } = router.query;
  const [state, setState] = useState({
    loading: true,
    ad: null,
    error: null,
  });

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    Promise.all([fetchAdById(id), fetchAdAnalytics(id)])
      .then(([adData, analytics]) => {
        if (cancelled) return;
        if (!adData) {
          setState({ loading: false, ad: null, error: "notFound" });
          return;
        }
        const merged = ensureAdLifecycle({ ...adData, ...(analytics || {}) });
        setState({ loading: false, ad: merged, error: null });
      })
      .catch((err) => {
        if (cancelled) return;
        const forbidden = err?.response?.status === 403;
        setState({
          loading: false,
          ad: null,
          error: forbidden ? "forbidden" : "generic",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (state.loading) {
    return (
      <InstructorLayout>
        <div className={styles.state}>
          {t("loading")}
        </div>
      </InstructorLayout>
    );
  }

  if (state.error === "forbidden") {
    return (
      <InstructorLayout>
        <div className={styles.state}>
          <p>
            {t("plan_required", {
              defaultValue:
                "Your current subscription does not include ad analytics. Upgrade to unlock performance insights.",
            })}
          </p>
          <Link
            href="/dashboard/instructor/plans"
            className={`${styles.button} ${styles.primary}`}
          >
            {t("view_plans_cta", { defaultValue: "View instructor plans" })}
          </Link>
        </div>
      </InstructorLayout>
    );
  }

  if (!state.ad) {
    return (
      <InstructorLayout>
        <div className={styles.state}>
          {state.error === "notFound"
            ? t("not_found", { defaultValue: "Ad not found" })
            : t("error_loading", { defaultValue: "Unable to load analytics" })}
        </div>
      </InstructorLayout>
    );
  }

  const ad = state.ad;
  const safeTargetRoles = Array.isArray(ad.targetRoles) ? ad.targetRoles.filter(Boolean) : [];
  const statusLabel = getAdStatusLabel(ad.lifecycle?.status, tp);
  const statusDescription = describeAdLifecycle(
    ad.lifecycle,
    t,
    router.locale
  );
  const statusVariant = getAdStatusClasses(ad.lifecycle?.status);

  const analyticsData = Array.isArray(ad.analytics) ? ad.analytics : [];
  const normalizedAnalytics = analyticsData.map((entry) => ({
    day: entry?.day ?? "",
    views:
      typeof entry?.views === "number" && Number.isFinite(entry.views)
        ? entry.views
        : 0,
  }));

  const locationStats = Array.isArray(ad.locationStats) ? ad.locationStats : [];
  const normalizedLocationStats = locationStats.map((entry) => ({
    country: entry?.country || t("unknown_label", { defaultValue: "Unknown" }),
    views:
      typeof entry?.views === "number" && Number.isFinite(entry.views)
        ? entry.views
        : 0,
  }));

  const formatNumber = (value) => {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value.toLocaleString();
    }
    if (typeof value === "string" && value.trim()) return value;
    return "0";
  };

  const formatPercentage = (value) => {
    if (typeof value === "number" && Number.isFinite(value)) {
      return `${value.toFixed(2)}%`;
    }
    return "0.00%";
  };

  const metrics = [
    {
      key: "views",
      label: t("metrics.views", { defaultValue: "Views" }),
      value: formatNumber(ad.views),
    },
    {
      key: "ctr",
      label: t("metrics.ctr", { defaultValue: "CTR" }),
      value: formatPercentage(ad.ctr),
    },
    {
      key: "conversions",
      label: t("metrics.conversions", { defaultValue: "Conversions" }),
      value: formatNumber(ad.conversions),
    },
    {
      key: "reach",
      label: t("metrics.reach", { defaultValue: "Reach" }),
      value: formatNumber(ad.reach),
    },
  ];

  return (
    <InstructorLayout>
      <PageHead title={`${t('title_prefix')} - ${ad.title}`} />

      <div className={styles.container}>
        <div className={styles.topBar}>
          <div className={styles.header}>
            <h1 className={styles.title}>{ad.title}</h1>
            <p className={styles.subtitle}>
              {t('overview')}
            </p>
          </div>
        </div>

        <div className={`${styles.panel} ${styles.infoGrid}`}>
          <div className={styles.mediaBox}>
            {ad.image ? (
              <img src={ad.image} alt={ad.title} className={styles.media} />
            ) : (
              <div className={styles.emptyMedia}>
                {t("no_media", { defaultValue: "No media available" })}
              </div>
            )}
          </div>
          <div className={styles.infoList}>
            <div><strong>{t('description')}:</strong> {ad.description}</div>
            <div>
              <strong>{t('target_roles')}:</strong>{" "}
              {safeTargetRoles.length ? (
                <div className={styles.tagRow}>
                  {safeTargetRoles.map((role) => (
                    <span key={role} className={styles.tag}>{role}</span>
                  ))}
                </div>
              ) : (
                <span className={styles.statusDescription}>
                  {t("no_target_roles", { defaultValue: "Not specified" })}
                </span>
              )}
            </div>
            <div><strong>{t('duration')}:</strong> {ad.startAt} → {ad.endAt}</div>
            <div><strong>{t('ad_type')}:</strong> {ad.adType}</div>
            <div>
              <strong>{t('status')}:</strong>
              <div className={styles.statusRow}>
                <span className={`${badgeStyles.badge} ${badgeStyles[statusVariant] || badgeStyles.default}`}>
                  {statusLabel}
                </span>
              </div>
              {statusDescription && (
                <p className={styles.statusDescription}>
                  {statusDescription}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className={styles.panel}>
          <h2 className={styles.chartTitle}>📊 {t('performance_metrics')}</h2>
          <div className={styles.metrics}>
            {metrics.map((metric) => (
              <div key={metric.key} className={styles.metricCard}>
                <div className={styles.metricLabel}>{metric.label}</div>
                <div className={styles.metricValue}>{metric.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.chartCard}>
          <h2 className={styles.chartTitle}>📈 {t('views_over_time')}</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={normalizedAnalytics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="views" stroke="#2563eb" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.chartCard}>
          <h2 className={styles.chartTitle}>🌍 {t('views_by_country')}</h2>
          {normalizedLocationStats.length ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={normalizedLocationStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="country" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="views" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className={styles.emptyState}>{t('no_data', { defaultValue: 'No data' })}</p>
          )}
        </div>
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
