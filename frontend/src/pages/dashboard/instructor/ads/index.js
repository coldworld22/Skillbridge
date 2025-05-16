// pages/dashboard/instructor/ads/index.js
import { useState, useEffect, useMemo } from "react";
import { FaPlus } from "react-icons/fa";
import Link from "next/link";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import AdCard from "@/components/admin/ads/AdCard"; // You can reuse this
import PreviewModal from "@/components/admin/ads/PreviewModalinstrutor";

export default function InstructorAdsPage() {
  const [ads, setAds] = useState([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAds, setSelectedAds] = useState([]);
  const [previewAd, setPreviewAd] = useState(null);
  const ITEMS_PER_PAGE = 6;

  useEffect(() => {
    setAds(mockAds); // Replace with real fetch scoped to instructor
  }, []);

  const toggleAdStatus = (id) => {
    setAds((prev) =>
      prev.map((ad) =>
        ad.id === id ? { ...ad, isActive: !ad.isActive } : ad
      )
    );
  };

  const handleEdit = (ad) => {
    window.location.href = `/dashboard/instructor/ads/edit/${ad.id}`;
  };

  const handleAnalytics = (ad) => {
    window.location.href = `/dashboard/instructor/ads/analytics/${ad.id}`;
  };

  const handleDelete = (ad) => {
    if (confirm(`Delete "${ad.title}"?`)) {
      setAds((prev) => prev.filter((a) => a.id !== ad.id));
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
          <h1 className="text-3xl font-bold">📢 My Ads</h1>
          <Link href="/dashboard/instructor/ads/create">
            <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2">
              <FaPlus /> New Ad
            </button>
          </Link>
        </header>

        <section className="flex flex-wrap gap-4 mb-6">
          <input
            type="search"
            placeholder="Search ads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border rounded w-full md:w-1/3"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border rounded"
          >
            <option value="all">All Types</option>
            <option value="promotion">Promotion</option>
            <option value="event">Event</option>
            <option value="announcement">Announcement</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border rounded"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </section>

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

const mockAds = Array.from({ length: 6 }, (_, i) => ({
  id: i + 1,
  title: `My Ad ${i + 1}`,
  description: "Promote your course now!",
  image: `https://picsum.photos/seed/instructor${i}/400/200`,
  adType: ["promotion", "event", "announcement"][i % 3],
  targetRoles: ["student"],
  isActive: i % 2 === 0,
  startAt: "2025-05-01",
  endAt: "2025-05-10",
  views: Math.floor(Math.random() * 300),
}));
