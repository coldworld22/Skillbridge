// pages/dashboard/instructor/ads/index.js
import { useState, useEffect, useMemo } from "react";
import { FaPlus } from "react-icons/fa";
import Link from "next/link";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import AdCard from "@/components/admin/ads/AdCard";
import PreviewModal from "@/components/admin/ads/PreviewModalInstructor";
import { fetchAds, deleteAd } from "@/services/admin/adService";
import { toast } from "react-toastify";
import { createNotification } from "@/services/notificationService";
import { sendChatMessage } from "@/services/messageService";
import useAuthStore from "@/store/auth/authStore";
import useNotificationStore from "@/store/notifications/notificationStore";
import useMessageStore from "@/store/messages/messageStore";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../next-i18next.config.js";

export default function InstructorAdsPage() {
  const { t } = useTranslation("dashboard", { keyPrefix: "adsPage" });
  const [ads, setAds] = useState([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAds, setSelectedAds] = useState([]);
  const [previewAd, setPreviewAd] = useState(null);
  const ITEMS_PER_PAGE = 6;
  const user = useAuthStore((s) => s.user);
  const refreshNotifications = useNotificationStore((s) => s.fetch);
  const refreshMessages = useMessageStore((s) => s.fetch);

  const notify = async (type, message) => {
    try {
      await createNotification({ user_id: user.id, type, message });
      await sendChatMessage(user.id, { text: message });
      refreshNotifications?.();
      refreshMessages?.();
    } catch (err) {
      console.error("[InstructorAdsPage] notification error", err);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    fetchAds()
      .then((data) => {
        const mine = data.filter(
          (ad) => ad.created_by === user.id || ad.createdBy === user.id
        );
        setAds(mine);
      })
      .catch(() => setAds([]));
  }, [user?.id]);

  const handleEdit = (ad) => {
    window.location.href = `/dashboard/instructor/ads/edit/${ad.id}`;
  };

  const handleAnalytics = (ad) => {
    window.location.href = `/dashboard/instructor/ads/analytics/${ad.id}`;
  };

  const handleDelete = async (ad) => {
    if (confirm(t('confirm_delete', { title: ad.title }))) {
      try {
        await deleteAd(ad.id);
        setAds((prev) => prev.filter((a) => a.id !== ad.id));
        toast.success(t('deleted'));
        await notify('ad_deleted', `Ad "${ad.title}" deleted`);
      } catch {
        toast.error(t('delete_failed'));
      }
    }
  };

  const handlePreview = (ad) => setPreviewAd(ad);

  const toggleSelect = (id) => {
    setSelectedAds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const filteredAds = useMemo(() => {
    return ads.filter((ad) => {
      const matchesSearch =
        ad.title.toLowerCase().includes(search.toLowerCase()) ||
        ad.description.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "active" && ad.isActive) ||
        (filterStatus === "inactive" && !ad.isActive);
      const matchesType = filterType === "all" || ad.adType === filterType;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [ads, search, filterStatus, filterType]);

  const totalPages = Math.ceil(filteredAds.length / ITEMS_PER_PAGE);
  const paginatedAds = filteredAds.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <InstructorLayout>
      <div className="p-6">
        <header className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <h1 className="text-3xl font-bold">📢 {t("title")}</h1>
          <Link href="/dashboard/instructor/ads/create">
            <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2">
              <FaPlus /> {t("new_ad")}
            </button>
          </Link>
        </header>

        <section className="flex flex-wrap gap-4 mb-6">
          <input
            type="search"
            placeholder={t("search_placeholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border rounded w-full md:w-1/3"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border rounded"
          >
            <option value="all">{t("all_types")}</option>
            <option value="promotion">{t("promotion")}</option>
            <option value="event">{t("event")}</option>
            <option value="announcement">{t("announcement")}</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border rounded"
          >
            <option value="all">{t("all_status")}</option>
            <option value="active">{t("active")}</option>
            <option value="inactive">{t("inactive")}</option>
          </select>
        </section>

        {paginatedAds.length === 0 ? (
          <p className="text-gray-500 text-center mt-10">{t("no_ads")}</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedAds.map((ad) => (
                <AdCard
                  key={ad.id}
                  ad={ad}
                  handleEdit={handleEdit}
                  handleDelete={handleDelete}
                  handlePreview={handlePreview}
                  handleAnalytics={handleAnalytics}
                  isSelected={selectedAds.includes(ad.id)}
                  toggleSelect={toggleSelect}
                />
              ))}
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1 rounded border text-sm font-medium transition-colors duration-200 ${
                    currentPage === i + 1
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      <PreviewModal ad={previewAd} onClose={() => setPreviewAd(null)} />
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

