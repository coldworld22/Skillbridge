// pages/admin/ads/analytics/[id].js
import { useRouter } from "next/router";
import AdminLayout from "@/components/layouts/AdminLayout";
import { useState } from "react";
import PageHead from "@/components/common/PageHead";
import { updateAd, deleteAd } from "@/services/admin/adService";
import { toast } from "react-toastify";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../next-i18next.config.js";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  ResponsiveContainer,
} from "recharts";
import Image from "next/image";
import { ensureAdLifecycle } from "@/utils/ads/lifecycle";
import {
  describeAdLifecycle,
  getAdStatusClasses,
  getAdStatusLabel,
} from "@/utils/ads/presentation";
import { resolveApiBase } from "@/utils/serverApi";
import { mapApiAdToClient } from "@/services/admin/mapApiAdToClient";
import badgeStyles from "@/styles/components/statusBadges.module.scss";
import styles from "../../../ads/ads-analytics.module.scss";

export default function AdAnalyticsPage({ ad: initialAd, error }) {
  const router = useRouter();
  const { id } = router.query;
  const { t } = useTranslation('dashboard', { keyPrefix: 'adsAnalyticsPage' });
  const { t: tp } = useTranslation('dashboard', { keyPrefix: 'adsPage' });

  const [adState, setAdState] = useState(initialAd);
  const ad = adState ? ensureAdLifecycle(adState) : null;
  const [statusLoading, setStatusLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (error) {
    return (
      <AdminLayout>
        <div className={`${styles.state} ${styles.stateError}`}>{t('error_loading') || 'Failed to load analytics'}</div>
      </AdminLayout>
    );
  }

  if (!ad) {
    return (
      <AdminLayout>
        <div className={styles.state}>{t('not_found') || 'Ad not found'}</div>
      </AdminLayout>
    );
  }

  const handleEdit = () => router.push(`/dashboard/admin/ads/edit/${id}`);
  const toggleStatus = async () => {
    if (!ad) return;
    setStatusLoading(true);
    try {
      await updateAd(id, { is_active: !ad.isActive });
      setAdState((prev) => {
        if (!prev) return prev;
        return ensureAdLifecycle({ ...prev, isActive: !prev.isActive });
      });
      toast.success(tp('status_updated'));
    } catch {
      toast.error(tp('error_generic'));
    } finally {
      setStatusLoading(false);
    }
  };
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteAd(id);
      toast.success(tp('deleted'));
      router.push('/dashboard/admin/ads');
    } catch {
      toast.error(tp('delete_failed'));
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const safeTargetRoles = Array.isArray(ad.targetRoles)
    ? ad.targetRoles.filter(Boolean)
    : [];

  const analyticsData = Array.isArray(ad.analytics) ? ad.analytics : [];
  const normalizedAnalytics = analyticsData.map((entry) => ({
    day: entry?.day ?? "",
    views:
      typeof entry?.views === "number" && Number.isFinite(entry.views)
        ? entry.views
        : 0,
  }));

  const rawLocations = Array.isArray(ad.locationStats) ? ad.locationStats : [];
  const normalizedLocationStats = rawLocations.map((entry) => ({
    country:
      entry?.country?.trim() ||
      t("unknown_label", { defaultValue: "Unknown" }),
    views:
      typeof entry?.views === "number" && Number.isFinite(entry.views)
        ? entry.views
        : 0,
  }));

  const rawDevices = Array.isArray(ad.devices) ? ad.devices : [];
  const normalizedDevices = rawDevices.map((device) => ({
    user_agent:
      device?.user_agent?.trim() ||
      t("metrics.unknown_device", { defaultValue: "Unknown device" }),
    views:
      typeof device?.views === "number" && Number.isFinite(device.views)
        ? device.views
        : null,
  }));

  const formatNumber = (value) => {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value.toLocaleString();
    }
    if (typeof value === "string" && value.trim()) {
      return value;
    }
    return "0";
  };

  const formatPercentage = (value) => {
    if (typeof value === "number" && Number.isFinite(value)) {
      return `${value.toFixed(2)}%`;
    }
    return "0.00%";
  };

  const formatDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString();
  };

  const startLabel = formatDate(ad.startAt);
  const endLabel = formatDate(ad.endAt);
  const durationLabel =
    startLabel || endLabel
      ? t("duration_range", {
          start:
            startLabel ??
            t("date_unavailable", { defaultValue: "Not set" }),
          end:
            endLabel ?? t("date_unavailable", { defaultValue: "Not set" }),
        })
      : t("duration_unavailable", { defaultValue: "Not scheduled" });

  const deviceSummary = normalizedDevices.length
    ? normalizedDevices
        .map((device) =>
          device.views
            ? `${device.user_agent} (${device.views})`
            : device.user_agent,
        )
        .join(", ")
    : t("metrics.no_device_data", { defaultValue: "-" });

  const adTypeLabel =
    ad.adType ||
    t("unknown_label", { defaultValue: "Unknown" });

  const metrics = [
    {
      key: "views",
      label: t("metrics.views", { defaultValue: "Views" }),
      value: formatNumber(ad.views),
      icon: "👁️",
    },
    {
      key: "ctr",
      label: t("metrics.ctr", { defaultValue: "CTR" }),
      value: formatPercentage(ad.ctr),
      icon: "📈",
    },
    {
      key: "conversions",
      label: t("metrics.conversions", { defaultValue: "Conversions" }),
      value: formatNumber(ad.conversions),
      icon: "🎯",
    },
    {
      key: "reach",
      label: t("metrics.reach", { defaultValue: "Reach" }),
      value: formatNumber(ad.reach),
      icon: "📊",
    },
    {
      key: "top_devices",
      label: t("metrics.top_devices", { defaultValue: "Top Devices" }),
      value: deviceSummary,
      icon: "📱",
    },
  ];

  const pageTitle = ad.title
    ? `${t("title_prefix")} - ${ad.title}`
    : t("title_prefix");
  const statusLabel = getAdStatusLabel(ad.lifecycle?.status, tp);
  const statusDescription = describeAdLifecycle(
    ad.lifecycle,
    t,
    router.locale
  );
  const statusVariant = getAdStatusClasses(ad.lifecycle?.status);

  return (
    <AdminLayout>
      <PageHead title={pageTitle} />

      <div className={styles.container}>
        {/* Header */}
        <div className={styles.topBar}>
          <div className={styles.header}>
            <h1 className={styles.title}>{ad.title}</h1>
            <p className={styles.subtitle}>{t('overview')}</p>
          </div>
          <div className={styles.actions}>
            <button onClick={handleEdit} className={`${styles.button} ${styles.ghost}`}>
              {t('edit', { defaultValue: 'Edit' })}
            </button>
            <button
              onClick={toggleStatus}
              disabled={statusLoading}
              className={`${styles.button} ${ad.isActive ? styles.ghost : styles.primary}`}
            >
              {ad.isActive
                ? t('deactivate', { defaultValue: 'Deactivate' })
                : t('activate', { defaultValue: 'Activate' })}
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className={`${styles.button} ${styles.danger}`}
            >
              {t('delete', { defaultValue: 'Delete' })}
            </button>
          </div>
        </div>

        {/* Ad Info */}
        <div className={`${styles.panel} ${styles.infoGrid}`}>
          <div className={styles.mediaBox}>
            {ad.video ? (
              <video src={ad.video} className={styles.media} controls />
            ) : ad.image ? (
              <Image
                src={ad.image}
                alt={ad.title}
                width={600}
                height={192}
                unoptimized
                className={styles.media}
              />
            ) : (
              <div className={styles.emptyMedia}>
                {t("no_media", { defaultValue: "No media available" })}
              </div>
            )}
          </div>
          <div className={styles.infoList}>
            <div>
              <strong>{t('description')}:</strong>{" "}
              {ad.description?.trim() ||
                t("no_description", { defaultValue: "No description provided." })}
            </div>
            <div>
              <strong>{t('target_roles')}:</strong>
              {safeTargetRoles.length ? (
                <div className={styles.tagRow}>
                  {safeTargetRoles.map((role) => (
                    <span key={role} className={styles.tag}>
                      {role}
                    </span>
                  ))}
                </div>
              ) : (
                <span className={styles.statusDescription}>
                  {t("no_target_roles", { defaultValue: "Not specified" })}
                </span>
              )}
            </div>
            <div>
              <strong>{t('duration')}:</strong> 📅 {durationLabel}
            </div>
            <div>
              <strong>{t('ad_type')}:</strong> 📌{" "}
              <span className={styles.tag}>{adTypeLabel}</span>
            </div>
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

        {/* Performance Metrics */}
        <div className={styles.panel}>
          <h2 className={styles.chartTitle}>📊 {t('performance_metrics')}</h2>
          <div className={styles.metrics}>
            {metrics.map((item) => (
              <div key={item.key} className={styles.metricCard}>
                <div className={styles.metricLabel}>{item.icon} {item.label}</div>
                <div className={styles.metricValue}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart: Views Over Time */}
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

        {/* Chart: Views by Country */}
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
            <p className={styles.emptyState}>
              {t('no_data', { defaultValue: 'No data available' })}
            </p>
          )}
        </div>

        {showDeleteModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalCard}>
              <p>
                {t('delete_confirmation', {
                  title: ad.title,
                  defaultValue: 'Are you sure you want to delete "{{title}}"?',
                })}
              </p>
              <div className={styles.modalActions}>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className={`${styles.modalButton} ${styles.ghost}`}
                >
                  {tp('close')}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className={`${styles.modalButton} ${styles.danger}`}
                >
                  {deleting
                    ? t('loading')
                    : tp('delete_ad')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export async function getServerSideProps({ params, locale, req }) {
  const headers = req.headers?.cookie ? { cookie: req.headers.cookie } : {};
  const apiBase = resolveApiBase(false);
  const analyticsDefaults = {
    views: 0,
    ctr: 0,
    conversions: 0,
    reach: 0,
    devices: [],
    locationStats: [],
    analytics: [],
  };
  const redirectDestination = `/dashboard/admin/ads/analytics/${params.id}`;

  try {
    const adRes = await fetch(`${apiBase}/ads/${params.id}`, { headers });

    if (adRes.status === 404) {
      return { notFound: true };
    }
    if (adRes.status === 401 || adRes.status === 403) {
      return {
        redirect: {
          destination: `/auth/login?next=${encodeURIComponent(redirectDestination)}`,
          permanent: false,
        },
      };
    }
    if (!adRes.ok) {
      throw new Error(`Failed to load ad (${adRes.status})`);
    }

    const adJson = await adRes.json();
    const adData = adJson?.data ? mapApiAdToClient(adJson.data) : null;
    if (!adData) {
      return { notFound: true };
    }

    let analyticsData = analyticsDefaults;
    try {
      const analyticsRes = await fetch(
        `${apiBase}/ads/${params.id}/analytics`,
        { headers }
      );
      if (analyticsRes.ok) {
        const analyticsJson = await analyticsRes.json();
        analyticsData = {
          ...analyticsDefaults,
          ...(analyticsJson?.data || {}),
        };
      }
    } catch {
      analyticsData = analyticsDefaults;
    }

    const merged = ensureAdLifecycle({ ...adData, ...analyticsData });

    return {
      props: {
        ad: merged,
        ...(await serverSideTranslations(
          locale,
          ["dashboard"],
          nextI18NextConfig
        )),
      },
    };
  } catch (_err) {
    return {
      props: {
        ad: null,
        error: true,
        ...(await serverSideTranslations(
          locale,
          ["dashboard"],
          nextI18NextConfig
        )),
      },
    };
  }
}
