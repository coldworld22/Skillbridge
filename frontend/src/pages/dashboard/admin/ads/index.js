import { useState, useEffect, useMemo } from "react";
import { FaPlus, FaChartBar } from "react-icons/fa";
import Link from "next/link";
import AdminLayout from "@/components/layouts/AdminLayout";
import { CSVLink } from "react-csv";
import AdCard from "@/components/admin/ads/AdCard"; // Extract AdCard for maintainability
import PreviewModal from "@/components/admin/ads/PreviewModal"; // Extract modal too

export default function AdminAdsPage() {
    const [ads, setAds] = useState([]);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterRole, setFilterRole] = useState("all");
    const [filterType, setFilterType] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedAds, setSelectedAds] = useState([]);
    const [previewAd, setPreviewAd] = useState(null);
    const ITEMS_PER_PAGE = 6;

    useEffect(() => {
        setAds(mockAds); // Load mock ads or replace with real API call
    }, []);

    const toggleAdStatus = (id) => {
        setAds((prev) =>
            prev.map((ad) =>
                ad.id === id ? { ...ad, isActive: !ad.isActive } : ad
            )
        );
    };

    const handleEdit = (ad) => {
        window.location.href = `/dashboard/admin/ads/edit/${ad.id}`;
      };
      
    const handleDelete = (ad) => {
        if (confirm(`Delete "${ad.title}"?`)) {
            setAds((prev) => prev.filter((a) => a.id !== ad.id));
        }
    };

    const handleAnalytics = (ad) => {
        window.location.href = `/dashboard/admin/ads/analytics/${ad.id}`;
      };
      
    const handlePreview = (ad) => setPreviewAd(ad);

    const toggleSelect = (id) => {
        setSelectedAds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const bulkDelete = () => {
        if (confirm("Delete selected ads?")) {
            setAds((prev) => prev.filter((ad) => !selectedAds.includes(ad.id)));
            setSelectedAds([]);
        }
    };

    const filteredAds = useMemo(() => {
        return ads.filter((ad) => {
            const matchesSearch = ad.title.toLowerCase().includes(search.toLowerCase()) ||
                ad.description.toLowerCase().includes(search.toLowerCase());
            const matchesStatus =
                filterStatus === "all" ||
                (filterStatus === "active" && ad.isActive) ||
                (filterStatus === "inactive" && !ad.isActive);
            const matchesRole =
                filterRole === "all" || ad.targetRoles.includes(filterRole);
            const matchesType = filterType === "all" || ad.adType === filterType;

            return matchesSearch && matchesStatus && matchesRole && matchesType;
        });
    }, [ads, search, filterStatus, filterRole, filterType]);

    const totalPages = Math.ceil(filteredAds.length / ITEMS_PER_PAGE);
    const paginatedAds = filteredAds.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

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
                            📤 Export CSV
                        </CSVLink>

                    </div>
                    <h1 className="text-3xl font-bold">Manage Ads</h1>
                    <Link href="/dashboard/admin/ads/create">
                        <button className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 flex items-center gap-2">
                            <FaPlus /> New Ad
                        </button>
                    </Link>

                </header>

                <section className="flex flex-wrap gap-4 mb-6">
                    <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-4 py-2 border rounded">
                        <option value="all">All Types</option>
                        <option value="promotion">Promotion</option>
                        <option value="event">Event</option>
                        <option value="announcement">Announcement</option>
                        <option value="internal">Internal</option>
                    </select>
                    <input
                        type="search"
                        placeholder="Search ads..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="px-4 py-2 border rounded w-full md:w-1/3"
                    />
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2 border rounded">
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                    <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="px-4 py-2 border rounded">
                        <option value="all">All Roles</option>
                        <option value="student">Student</option>
                        <option value="instructor">Instructor</option>
                    </select>
                </section>

                {selectedAds.length > 0 && (
                    <div className="mb-4 bg-yellow-50 border border-yellow-200 p-4 rounded flex justify-between items-center">
                        <span>{selectedAds.length} selected</span>
                        <button onClick={bulkDelete} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">
                            Delete Selected
                        </button>
                    </div>
                )}

                {paginatedAds.length === 0 ? (
                    <p className="text-gray-500 text-center mt-10">No ads found.</p>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {paginatedAds.map((ad) => (
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
                                    className={`px-3 py-1 rounded border text-sm font-medium transition-colors duration-200 ${currentPage === i + 1
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

const mockAds = Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    title: `Ad Campaign ${i + 1}`,
    description: "Promote your course now!",
    image: `https://picsum.photos/seed/${i}/400/200`,
    adType: ["promotion", "event", "announcement", "internal"][i % 4],
    targetRoles: ["student", "instructor"].filter((_, r) => (i + r) % 2 === 0),
    isActive: i % 2 === 0,
    startAt: "2025-05-01",
    endAt: "2025-05-10",
    views: Math.floor(Math.random() * 300),
}));
