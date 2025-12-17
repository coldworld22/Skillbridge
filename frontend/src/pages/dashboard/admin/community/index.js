import { useEffect, useState, useCallback } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import {
  FaCommentDots,
  FaExclamationTriangle,
  FaUsers,
  FaBullhorn,
  FaCogs,
} from "react-icons/fa";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import { fetchDashboardStats } from "@/services/admin/communityService";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../next-i18next.config.js";

export async function getServerSideProps({ req, locale }) {
  const headers = req.headers.cookie ? { Cookie: req.headers.cookie } : {};
  let stats = null;
  try {
    stats = await fetchDashboardStats(headers);
  } catch (err) {
    console.error("Dashboard fetch error:", err.message);
  }

  return {
    props: {
      ...(await serverSideTranslations(locale ?? "en", ["dashboard"], nextI18NextConfig)),
      initialStats: stats,
    },
  };
}

const NavCard = ({ href, icon, label }) => (
  <Link href={href}>
    <div className="bg-white hover:bg-gray-100 transition p-5 rounded-xl cursor-pointer shadow border border-gray-200 flex items-center gap-4">
      <div className="text-3xl text-yellow-500">{icon}</div>
      <div className="text-base font-semibold text-gray-800">{label}</div>
    </div>
  </Link>
);

const StatCard = ({ label, value, color }) => (
  <div className={`rounded-lg p-5 text-white shadow flex flex-col gap-1 ${color}`}>
    <span className="text-sm uppercase tracking-wide font-medium">{label}</span>
    <span className="text-2xl font-bold">{value}</span>
  </div>
);

const normalizeStats = (data) => {
  if (!data) return null;
  return {
    totalDiscussions: data?.totalDiscussions ?? 0,
    pendingReports: data?.pendingReports ?? 0,
    contributors: data?.contributors ?? 0,
    repliesThisWeek: data?.repliesThisWeek ?? 0,
    topContributor: data?.topContributor || null,
  };
};

export default function AdminCommunityDashboard({ initialStats }) {
  const { t } = useTranslation("dashboard");
  const [stats, setStats] = useState(normalizeStats(initialStats));
  const [activityData, setActivityData] = useState(initialStats?.activityData || []);
  const [error, setError] = useState(null);
  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchDashboardStats();
      if (data) {
        setStats(normalizeStats(data));
        setActivityData(Array.isArray(data?.activityData) ? data.activityData : []);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError(t("adminCommunityDashboardPage.error"));
    }
  }, [t]);

  useEffect(() => {
    if (!stats) {
      load();
    }
  }, [stats, load]);

  if (error) {
    return (
      <AdminLayout title={t("adminCommunityDashboardPage.title")}>
        <div className="p-6">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={load}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            {t("adminCommunityDashboardPage.retry")}
          </button>
        </div>
      </AdminLayout>
    );
  }

  if (!stats) {
    return (
      <AdminLayout title={t("adminCommunityDashboardPage.title")}>
        <div className="p-6">{t("adminCommunityDashboardPage.loading")}</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={t("adminCommunityDashboardPage.title")}>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{t("adminCommunityDashboardPage.title")}</h1>
          <p className="text-gray-500 text-sm">
            {t("adminCommunityDashboardPage.description")}
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          <StatCard label={t("adminCommunityDashboardPage.stats.discussions")} value={stats.totalDiscussions ?? 0} color="bg-yellow-500" />
          <StatCard label={t("adminCommunityDashboardPage.stats.pendingReports")} value={stats.pendingReports ?? 0} color="bg-red-500" />
          <StatCard label={t("adminCommunityDashboardPage.stats.contributors")} value={stats.contributors ?? 0} color="bg-blue-500" />
          <StatCard label={t("adminCommunityDashboardPage.stats.repliesThisWeek")} value={stats.repliesThisWeek ?? 0} color="bg-green-500" />
        </div>

        {/* Navigation Cards */}
        <h2 className="text-xl font-bold text-gray-800 mb-4">{t("adminCommunityDashboardPage.manageSections")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <NavCard href="/dashboard/admin/community/discussions" label={t("adminCommunityDashboardPage.nav.manageDiscussions")} icon={<FaCommentDots />} />
          <NavCard href="/dashboard/admin/community/reports" label={t("adminCommunityDashboardPage.nav.reportedPosts")} icon={<FaExclamationTriangle />} />
          <NavCard href="/dashboard/admin/community/tags" label={t("adminCommunityDashboardPage.nav.manageTags")} icon={<FaCogs />} />
          <NavCard href="/dashboard/admin/community/contributors" label={t("adminCommunityDashboardPage.nav.topContributors")} icon={<FaUsers />} />
          <NavCard href="/dashboard/admin/community/announcements" label={t("adminCommunityDashboardPage.nav.postAnnouncement")} icon={<FaBullhorn />} />
          <NavCard href="/dashboard/admin/community/settings" label={t("adminCommunityDashboardPage.nav.settings")} icon={<FaCogs />} />
        </div>

        {/* Top Contributor */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-10">
          <h3 className="text-lg font-semibold mb-3">{t("adminCommunityDashboardPage.topContributor.title")}</h3>
          {stats.topContributor && stats.topContributor.name ? (
            <div className="flex items-center gap-4">
              <img
                src={stats.topContributor.avatar || "/images/default-avatar.png"}
                alt={stats.topContributor.name}
                className="w-12 h-12 rounded-full border object-cover"
              />
              <div>
                <p className="font-bold text-gray-800">{stats.topContributor.name}</p>
                <p className="text-sm text-gray-500">
                  {t("adminCommunityDashboardPage.topContributor.meta", {
                    contributions: stats.topContributor.contributions ?? 0,
                    reputation: stats.topContributor.reputation ?? 0,
                  })}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">{t("adminCommunityDashboardPage.topContributor.empty", "No standout contributors yet this week.")}</p>
          )}
        </div>

        {/* Activity Chart */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">{t("adminCommunityDashboardPage.activity.title")}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={activityData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="discussions" stroke="#F59E0B" name={t("adminCommunityDashboardPage.activity.discussions")} />
              <Line type="monotone" dataKey="reports" stroke="#EF4444" name={t("adminCommunityDashboardPage.activity.reports")} />
              <Line type="monotone" dataKey="replies" stroke="#10B981" name={t("adminCommunityDashboardPage.activity.replies")} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </AdminLayout>
  );
}
