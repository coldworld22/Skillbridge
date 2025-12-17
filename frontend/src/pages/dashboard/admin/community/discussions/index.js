import { useState, useEffect } from "react";
import Link from "next/link";
import AdminLayout from "@/components/layouts/AdminLayout";
import {
  FaSearch,
  FaLock,
  FaTrash,
  FaEye,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import {
  fetchDiscussions,
  lockDiscussionById,
  deleteDiscussionById,
} from "@/services/admin/communityService";
import { useTranslation, Trans } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../next-i18next.config.js";

export default function AdminCommunityDiscussionsPage() {
  const { t } = useTranslation("dashboard", {
    keyPrefix: "communityDiscussionsPage",
  });
  const [discussions, setDiscussions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchDiscussions();
        const formatted = (data || []).map((d) => ({
          id: d.id,
          title: d.title,
          user: d.user_id,
          replies: d.replies_count ?? 0,
          status: d.locked ? "locked" : "open",
        }));
        setDiscussions(formatted);
      } catch (err) {
        console.error("Failed to load discussions", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleLock = async (discussion) => {
    try {
      await lockDiscussionById(discussion.id);
      setDiscussions((prev) =>
        prev.map((d) =>
          d.id === discussion.id ? { ...d, status: "locked" } : d
        )
      );
    } catch (err) {
      console.error("Failed to lock discussion", err);
    }
  };

  const handleDelete = async (discussion) => {
    const confirmed = window.confirm(t("confirm_delete"));
    if (!confirmed) return;
    try {
      await deleteDiscussionById(discussion.id);
      setDiscussions((prev) => prev.filter((d) => d.id !== discussion.id));
    } catch (err) {
      console.error("Failed to delete discussion", err);
    }
  };

  const filtered = discussions.filter(
    (d) =>
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (statusFilter === "all" || d.status === statusFilter)
  );

  return (
    <AdminLayout title={t("title")}>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-1">{t("heading")}</h1>
          <p className="text-gray-500 text-sm">{t("description")}</p>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <div className="relative w-full sm:max-w-md">
            <input
              type="text"
              placeholder={t("search_placeholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <FaSearch className="absolute top-3 right-3 text-gray-400" />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-yellow-400"
          >
            <option value="all">{t("filter_all")}</option>
            <option value="open">{t("filter_open")}</option>
            <option value="locked">{t("filter_locked")}</option>
          </select>
        </div>

        {/* List */}
        <div className="space-y-4">
          {loading ? (
            <p className="text-gray-500">{t("loading")}</p>
          ) : filtered.length > 0 ? (
            filtered.map((discussion) => (
              <div
                key={discussion.id}
                className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white border border-gray-200 rounded-lg px-4 py-4 shadow-sm hover:shadow-md transition"
              >
                <div className="mb-3 sm:mb-0">
                  <h2 className="text-lg font-semibold text-gray-800">{discussion.title}</h2>
                  <p className="text-sm text-gray-500">
                    <Trans
                      i18nKey="by_user"
                      t={t}
                      values={{ user: discussion.user, replies: discussion.replies }}
                      components={{ strong: <strong /> }}
                    />
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1 ${
                      discussion.status === "open"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {discussion.status === "open" ? <FaCheckCircle /> : <FaTimesCircle />}
                    {t(`status.${discussion.status}`)}
                  </span>
                  <Link
                    href={{
                      pathname: "/dashboard/admin/community/discussions/[id]",
                      query: { id: discussion.id },
                    }}
                    className="bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded hover:bg-blue-200 flex items-center gap-2"
                  >
                    <FaEye /> {t("view")}
                  </Link>
                  {discussion.status !== "locked" && (
                    <button
                      onClick={() => handleLock(discussion)}
                      className="bg-yellow-100 text-yellow-700 text-sm px-3 py-1 rounded hover:bg-yellow-200 flex items-center gap-2"
                    >
                      <FaLock /> {t("lock")}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(discussion)}
                    className="bg-red-100 text-red-700 text-sm px-3 py-1 rounded hover:bg-red-200 flex items-center gap-2"
                  >
                    <FaTrash /> {t("delete")}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">{t("empty")}</p>
          )}
        </div>
      </div>
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
