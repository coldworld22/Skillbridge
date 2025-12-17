import { useState, useEffect, useMemo } from "react";
import { FaPlus } from "react-icons/fa";
import Link from "next/link";
import { useRouter } from "next/router";
import AdminLayout from "@/components/layouts/AdminLayout";
import { CSVLink } from "react-csv";
import AdCard from "@/components/admin/ads/AdCard"; // Extract AdCard for maintainability
import PreviewModal from "@/components/admin/ads/PreviewModal"; // Extract modal too
import { fetchAds, deleteAd, updateAd } from "@/services/admin/adService";
import { toast } from "react-toastify";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../next-i18next.config.js";
import useDebounce from "@/hooks/useDebounce";
import {
  ensureAdLifecycle,
  ensureAdListLifecycles,
  summarizeAdLifecycles,
  AD_STATUS,
} from "@/utils/ads/lifecycle";
import { getAdStatusLabel } from "@/utils/ads/presentation";

export default function AdminAdsPage() {
    // ─────────────────────
    // State Management
    // ─────────────────────
    const { t } = useTranslation('dashboard', { keyPrefix: 'adsPage' });
    const router = useRouter();
    const [ads, setAds] = useState([]);
    const [meta, setMeta] = useState({ total: 0 });
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 500);
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterRole, setFilterRole] = useState("all");
    const [filterType, setFilterType] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedAds, setSelectedAds] = useState([]);
    const [previewAd, setPreviewAd] = useState(null);
    const ITEMS_PER_PAGE = 6;

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch, filterRole, filterStatus, filterType]);

    // ─────────────────────
    // Fetch ads on mount
    // ─────────────────────
    useEffect(() => {
        fetchAds({
            limit: ITEMS_PER_PAGE,
            offset: (currentPage - 1) * ITEMS_PER_PAGE,
            role: filterRole !== "all" ? filterRole : undefined,
            status: filterStatus !== "all" ? filterStatus : undefined,
            type: filterType !== "all" ? filterType : undefined,
            search: debouncedSearch || undefined,
        })
            .then((res) => {
                setAds(ensureAdListLifecycles(res.data));
                setMeta(res.meta || {});
            })
            .catch(() => {
                setAds([]);
                setMeta({ total: 0 });
            });
    }, [currentPage, filterRole, filterStatus, filterType, debouncedSearch]);

    // ─────────────────────
    // Handlers
    // ─────────────────────
    const toggleAdStatus = async (id) => {
        const previousAds = ads;
        setAds((prev) =>
            prev.map((ad) =>
                ad.id === id
                    ? ensureAdLifecycle({ ...ad, isActive: !ad.isActive })
                    : ad
            )
        );
        const ad = previousAds.find((a) => a.id === id);
        if (ad) {
            try {
                await updateAd(id, { is_active: !ad.isActive });
                toast.success(t('status_updated'));
            } catch {
                setAds(previousAds);
                toast.error(t('error_generic'));
            }
        }
    };

    const handleEdit = (ad) => {
        router.push(`/dashboard/admin/ads/edit/${ad.id}`);
      };
      
    const handleDelete = async (ad) => {
        if (confirm(t('confirm_delete', { title: ad.title }))) {
            try {
                await deleteAd(ad.id);
                setAds((prev) => prev.filter((a) => a.id !== ad.id));
                toast.success(t('deleted'));
            } catch {
                toast.error(t('error_generic'));
            }
        }
    };

    const handleAnalytics = (ad) => {
        router.push(`/dashboard/admin/ads/analytics/${ad.id}`);
      };
      
    const handlePreview = (ad) => setPreviewAd(ad);

    const toggleSelect = (id) => {
        setSelectedAds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const bulkDelete = async () => {
        if (!confirm(t('confirm_bulk_delete'))) return;
        const results = await Promise.allSettled(
            selectedAds.map((id) => deleteAd(id))
        );
        const successfulIds = [];
        results.forEach((res, index) => {
            const id = selectedAds[index];
            if (res.status === "fulfilled") {
                successfulIds.push(id);
            } else {
                const ad = ads.find((a) => a.id === id);
                toast.error(`${ad?.title || id}: ${t('delete_failed')}`);
            }
        });
        if (successfulIds.length) {
            setAds((prev) => prev.filter((ad) => !successfulIds.includes(ad.id)));
            toast.success(t('deleted'));
        }
        setSelectedAds((prev) => prev.filter((id) => !successfulIds.includes(id)));
    };

    const totalPages = Math.ceil((meta.total || 0) / ITEMS_PER_PAGE);
    const lifecycleSummary = useMemo(
        () => summarizeAdLifecycles(ads),
        [ads]
    );
    const alertItems = useMemo(() => {
        if (!lifecycleSummary?.hasAlerts) return [];
        const items = [];
        const expired = lifecycleSummary.attention[AD_STATUS.EXPIRED] || [];
        if (expired.length) {
            items.push({
                type: AD_STATUS.EXPIRED,
                count: expired.length,
                sample: expired.slice(0, 3),
            });
        }
        const paused = lifecycleSummary.attention[AD_STATUS.PAUSED] || [];
        if (paused.length) {
            items.push({
                type: AD_STATUS.PAUSED,
                count: paused.length,
                sample: paused.slice(0, 3),
            });
        }
        return items;
    }, [lifecycleSummary]);

    const renderAlertLine = (item) => {
        const label = getAdStatusLabel(item.type, t);
        const sampleTitles = item.sample
            .map((entry) => entry.title)
            .filter(Boolean);
        const hasMore = item.count > sampleTitles.length;
        const joined =
            sampleTitles.length === 0
                ? ""
                : `${sampleTitles.join(", ")}${hasMore ? "…" : ""}`;
        const examples = joined
            ? t("adsPage.status_alert_examples", {
                  defaultValue: "e.g. {{examples}}",
                  examples: joined,
              })
            : "";
        return t("adsPage.status_alert_line", {
            defaultValue: "{{label}} · {{count}} ads {{examples}}",
            label,
            count: item.count,
            examples,
        }).trim();
    };

    // ─────────────────────
    // Render
    // ─────────────────────

    return (
        <AdminLayout>
            <div className="p-6">
                <header className="flex justify-between items-center mb-6 flex-wrap gap-4">
                    <div className="flex gap-2">
                        <CSVLink
                            data={ads}
                            filename="ads_export.csv"
                            className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 text-sm"
                        >
                            📤 {t('export_csv')}
                        </CSVLink>

                    </div>
                    <h1 className="text-3xl font-bold">{t('title')}</h1>
                    <Link href="/dashboard/admin/ads/create">
                        <button className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 flex items-center gap-2">
                            <FaPlus /> {t('new_ad')}
                        </button>
                    </Link>

                </header>

                <section className="flex flex-wrap gap-4 mb-6">
                    <select value={filterType} onChange={(e) => { setCurrentPage(1); setFilterType(e.target.value); }} className="px-4 py-2 border rounded">
                        <option value="all">{t('all_types')}</option>
                        <option value="promotion">{t('promotion')}</option>
                        <option value="event">{t('event')}</option>
                        <option value="announcement">{t('announcement')}</option>
                        <option value="internal">{t('internal')}</option>
                    </select>
                    <input
                        type="search"
                        placeholder={t('search_placeholder')}
                        value={search}
                        onChange={(e) => { setCurrentPage(1); setSearch(e.target.value); }}
                        className="px-4 py-2 border rounded w-full md:w-1/3"
                    />
                    <select value={filterStatus} onChange={(e) => { setCurrentPage(1); setFilterStatus(e.target.value); }} className="px-4 py-2 border rounded">
                        <option value="all">{t('all_status')}</option>
                        <option value="active">{t('active')}</option>
                        <option value="inactive">{t('inactive')}</option>
                    </select>
                    <select value={filterRole} onChange={(e) => { setCurrentPage(1); setFilterRole(e.target.value); }} className="px-4 py-2 border rounded">
                        <option value="all">{t('all_roles')}</option>
                        <option value="student">{t('student')}</option>
                        <option value="instructor">{t('instructor')}</option>
                    </select>
                </section>

                {selectedAds.length > 0 && (
                    <div className="mb-4 bg-yellow-50 border border-yellow-200 p-4 rounded flex justify-between items-center">
                        <span>{selectedAds.length} {t('selected')}</span>
                        <button onClick={bulkDelete} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">
                            {t('delete_selected')}
                        </button>
                    </div>
                )}
                {alertItems.length > 0 && (
                    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 space-y-1">
                        <p className="font-semibold">
                            {t("adsPage.status_alert_title", {
                                defaultValue: "Some ads need your attention",
                            })}
                        </p>
                        <ul className="list-disc pl-5 space-y-1">
                            {alertItems.map((item) => (
                                <li key={item.type}>{renderAlertLine(item)}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {ads.length === 0 ? (
                    <p className="text-gray-500 text-center mt-10">{t('no_ads')}</p>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {ads.map((ad) => (
                                <AdCard
                                    key={ad.id}
                                    ad={ad}
                                    toggleAdStatus={toggleAdStatus}
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
