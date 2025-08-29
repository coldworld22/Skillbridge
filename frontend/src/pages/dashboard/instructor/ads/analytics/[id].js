// pages/instructor/ads/analytics/[id].js
import { useRouter } from "next/router";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import { useEffect, useState } from "react";
import PageHead from "@/components/common/PageHead";
import { fetchAdById, fetchAdAnalytics } from "@/services/admin/adService";
import useAuthStore from "@/store/auth/authStore";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, ResponsiveContainer
} from "recharts";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../next-i18next.config.js";

export default function InstructorAdAnalyticsPage() {
  const { t } = useTranslation("dashboard", { keyPrefix: "adsAnalyticsPage" });
  const { t: tp } = useTranslation("dashboard", { keyPrefix: "adsPage" });
  const router = useRouter();
  const { id } = router.query;
  const [ad, setAd] = useState(null);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (user && !user?.plan?.showAnalytics) {
      router.replace("/dashboard/instructor/ads");
      return;
    }
    if (!id || !user?.plan?.showAnalytics) return;
    Promise.all([fetchAdById(id), fetchAdAnalytics(id)])
      .then(([adData, analytics]) => {
        if (adData) {
          setAd({ ...adData, ...analytics });
        } else {
          setAd(null);
        }
      })
      .catch(() => router.replace("/dashboard/instructor/ads"));
  }, [id, user, router]);

  if (!ad) {
    return (
      <InstructorLayout>
        <div className="p-6 text-center text-sm text-muted-foreground">
          {t('loading')}
        </div>
      </InstructorLayout>
    );
  }

  return (
    <InstructorLayout>
      <PageHead title={`${t('title_prefix')} - ${ad.title}`} />

      <div className="p-4 sm:p-6 space-y-8 max-w-screen-xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{ad.title}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {t('overview')}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 grid md:grid-cols-2 gap-6">
          <div>
            <img src={ad.image} alt={ad.title} className="w-full h-48 object-cover rounded-md border" />
          </div>
          <div className="flex flex-col gap-4 text-sm text-gray-700">
            <div><strong>{t('description')}:</strong> {ad.description}</div>
            <div><strong>{t('target_roles')}:</strong> {ad.targetRoles.join(", ")}</div>
            <div><strong>{t('duration')}:</strong> {ad.startAt} → {ad.endAt}</div>
            <div><strong>{t('ad_type')}:</strong> {ad.adType}</div>
            <div><strong>{t('status')}:</strong> {ad.isActive ? tp('active') : tp('inactive')}</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <h2 className="text-xl font-semibold">📊 {t('performance_metrics')}</h2>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-700">
            {["Views", "CTR", "Conversions", "Reach"].map((label) => (
              <div key={label} className="bg-gray-50 p-4 rounded border">
                <div className="text-xs uppercase mb-1">{label}</div>
                <div className="text-base font-bold">
                  {label === "Views" ? ad.views :
                   label === "CTR" ? ad.ctr :
                   label === "Conversions" ? ad.conversions : ad.reach}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">📈 {t('views_over_time')}</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={ad.analytics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="views" stroke="#2563eb" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">🌍 {t('views_by_country')}</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={ad.locationStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="country" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="views" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </InstructorLayout>
  );
}

export async function getStaticPaths() {
  return { paths: [], fallback: true };
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["dashboard"], nextI18NextConfig)),
    },
  };
}
