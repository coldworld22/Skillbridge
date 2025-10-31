// pages/admin/ads/analytics/[id].js
import { useRouter } from "next/router";
import AdminLayout from "@/components/layouts/AdminLayout";
import { useState } from "react";
import PageHead from "@/components/common/PageHead";
import { fetchAdById, fetchAdAnalytics, updateAd, deleteAd } from "@/services/admin/adService";
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

export default function AdAnalyticsPage({ ad: initialAd, error }) {
  const router = useRouter();
  const { id } = router.query;
  const { t } = useTranslation('dashboard', { keyPrefix: 'adsAnalyticsPage' });
  const { t: tp } = useTranslation('dashboard', { keyPrefix: 'adsPage' });

  const [ad, setAd] = useState(initialAd);
  const [statusLoading, setStatusLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (error) {
    return (
      <AdminLayout>
        <div className="p-6 text-center text-sm text-red-600">{t('error_loading') || 'Failed to load analytics'}</div>
      </AdminLayout>
    );
  }

  if (!ad) {
    return (
      <AdminLayout>
        <div className="p-6 text-center text-sm text-muted-foreground">{t('not_found') || 'Ad not found'}</div>
      </AdminLayout>
    );
  }

  const handleEdit = () => router.push(`/dashboard/admin/ads/edit/${id}`);
  const toggleStatus = async () => {
    setStatusLoading(true);
    try {
      await updateAd(id, { is_active: !ad.isActive });
      setAd((prev) => ({ ...prev, isActive: !prev.isActive }));
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

  return (
    <AdminLayout>
      <PageHead title={pageTitle} />
  
      <div className="p-4 sm:p-6 space-y-8 max-w-screen-xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{ad.title}</h1>
            <p className="text-muted-foreground text-sm mt-1">{t('overview')}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={handleEdit} className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-100 text-sm">
              {t('edit', { defaultValue: 'Edit' })}
            </button>
            <button
              onClick={toggleStatus}
              disabled={statusLoading}
              className={`px-4 py-2 rounded text-sm text-white ${ad.isActive ? 'bg-gray-600 hover:bg-gray-700' : 'bg-blue-600 hover:bg-blue-700'} ${statusLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {ad.isActive
                ? t('deactivate', { defaultValue: 'Deactivate' })
                : t('activate', { defaultValue: 'Activate' })}
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm"
            >
              {t('delete', { defaultValue: 'Delete' })}
            </button>
          </div>
        </div>
  
        {/* Ad Info */}
        <div className="bg-white rounded-lg shadow p-6 grid md:grid-cols-2 gap-6">
          <div>
            {ad.video ? (
              <video src={ad.video} className="w-full h-48 object-cover rounded-md border" controls />
            ) : ad.image ? (
              <Image
                src={ad.image}
                alt={ad.title}
                width={600}
                height={192}
                unoptimized
                className="w-full h-48 object-cover rounded-md border"
              />
            ) : (
              <div className="flex h-48 w-full items-center justify-center rounded-md border bg-gray-50 text-sm text-gray-500">
                {t("no_media", { defaultValue: "No media available" })}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-4 text-sm text-gray-700">
            <div>
              <strong>{t('description')}:</strong>{" "}
              {ad.description?.trim() ||
                t("no_description", { defaultValue: "No description provided." })}
            </div>
            <div>
              <strong>{t('target_roles')}:</strong>
              {safeTargetRoles.length ? (
                <div className="mt-1 flex gap-2 flex-wrap">
                  {safeTargetRoles.map((role) => (
                    <span
                      key={role}
                      className="bg-gray-100 px-2 py-0.5 rounded text-xs capitalize"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="ml-1 text-xs text-gray-500">
                  {t("no_target_roles", { defaultValue: "Not specified" })}
                </span>
              )}
            </div>
            <div>
              <strong>{t('duration')}:</strong> 📅 {durationLabel}
            </div>
            <div>
              <strong>{t('ad_type')}:</strong> 📌{" "}
              <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                {adTypeLabel}
              </span>
            </div>
            <div>
              <strong>{t('status')}:</strong> ⚙️
              <span className={`ml-2 px-2 py-0.5 rounded text-xs ${ad.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>{ad.isActive ? tp('active') : tp('inactive')}</span>
            </div>
          </div>
        </div>
  
        {/* Performance Metrics */}
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <h2 className="text-xl font-semibold">📊 {t('performance_metrics')}</h2>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-700">
            {metrics.map((item) => (
              <div key={item.key} className="bg-gray-50 p-4 rounded border">
                <div className="text-xs uppercase mb-1">{item.icon} {item.label}</div>
                <div className="text-base font-bold">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
  
        {/* Chart: Views Over Time */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">📈 {t('views_over_time')}</h2>
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
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">🌍 {t('views_by_country')}</h2>
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
            <p className="text-center text-sm text-gray-500">
              {t('no_data', { defaultValue: 'No data available' })}
            </p>
          )}
        </div>

        {showDeleteModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded shadow space-y-4 max-w-sm">
              <p className="text-sm">
                {t('delete_confirmation', {
                  title: ad.title,
                  defaultValue: 'Are you sure you want to delete "{{title}}"?',
                })}
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border rounded text-sm"
                >
                  {tp('close')}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 rounded text-sm text-white bg-red-600 hover:bg-red-700"
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
  try {
    const headers = req.headers?.cookie ? { cookie: req.headers.cookie } : {};
    const [adData, analytics] = await Promise.all([
      fetchAdById(params.id, headers),
      fetchAdAnalytics(params.id, headers),
    ]);
    if (!adData) {
      return { notFound: true };
    }
    return {
      props: {
        ad: { ...adData, ...(analytics || {}) },
        ...(await serverSideTranslations(locale, ["dashboard"], nextI18NextConfig)),
      },
    };
  } catch (e) {
    return {
      props: {
        error: true,
        ...(await serverSideTranslations(locale, ["dashboard"], nextI18NextConfig)),
      },
    };
  }
}
