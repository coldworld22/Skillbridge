// pages/dashboard/student/community/index.js
import { useEffect, useState } from "react";
import StudentLayout from "@/components/layouts/StudentLayout";
import Link from "next/link";
import { FaSearch, FaPlus, FaTags } from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";
import { fetchDiscussions } from "@/services/communityService";
import useAuthStore from "@/store/auth/authStore";

export default function StudentCommunityPage() {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [activeTag, setActiveTag] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [allDiscussions, setAllDiscussions] = useState([]);
  const [tags, setTags] = useState([]);
  const itemsPerPage = 5;

  useEffect(() => {
    const load = async () => {
      try {
        const list = await fetchDiscussions();
        const formatted = (list || []).map((d) => ({
          id: d.id,
          title: d.title,
          user: d.user_name || "Anonymous",
          tags: Array.isArray(d.tags)
            ? d.tags
            : typeof d.tags === "string" && d.tags
            ? JSON.parse(d.tags)
            : [],
        }));
        setAllDiscussions(formatted);
        const tagSet = new Set();
        formatted.forEach((q) => q.tags?.forEach((t) => tagSet.add(t)));
        setTags(Array.from(tagSet));
      } catch (err) {
        console.error(err);
        toast.error("Failed to load discussions");
      }
    };
    load();
  }, []);

  const discussions =
    activeTab === "mine"
      ? allDiscussions.filter((d) => d.user === user?.full_name)
      : allDiscussions;

  const filtered = discussions.filter(
    (d) =>
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (activeTag === "" || d.tags?.some((t) => t.toLowerCase() === activeTag.toLowerCase()))
  );

  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <StudentLayout title="Community">
      <Toaster position="top-center" />
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header + CTA */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Community</h1>
            <p className="text-sm text-gray-500">
              Share your questions and get help from peers.
            </p>
          </div>
          <Link href="/dashboard/student/community/ask">
            <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-2 rounded-lg font-semibold flex items-center gap-2">
              <FaPlus /> Ask a Question
            </button>
          </Link>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-4 mb-6 text-sm">
          <button
            onClick={() => {
              setActiveTab("all");
              setCurrentPage(1);
            }}
            className={`px-4 py-1.5 rounded-full font-semibold ${
              activeTab === "all"
                ? "bg-yellow-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All Discussions
          </button>
          <button
            onClick={() => {
              setActiveTab("mine");
              setCurrentPage(1);
            }}
            className={`px-4 py-1.5 rounded-full font-semibold ${
              activeTab === "mine"
                ? "bg-yellow-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            My Questions
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md mb-6">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm pr-10 focus:outline-none focus:ring-yellow-400"
          />
          <FaSearch className="absolute top-3 right-3 text-gray-400" />
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-8 items-center">
          <FaTags className="text-yellow-500" />
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag === activeTag ? "" : tag)}
              className={`px-3 py-1 rounded-full text-sm border ${
                tag === activeTag
                  ? "bg-yellow-500 text-white border-yellow-500"
                  : "bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200"
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>

        {/* Discussion List */}
        <div className="space-y-4">
          {paginated.length > 0 ? (
            paginated.map((d) => (
              <Link
                key={d.id}
                href={`/dashboard/student/community/questions/${d.id}`}
              >
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition cursor-pointer">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">
                    {d.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {activeTab === "mine" ? "You" : d.user}
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-gray-500">No discussions found.</p>
          )}
        </div>

        {/* Pagination */}
        {filtered.length > itemsPerPage && (
          <div className="flex justify-center mt-6 gap-4">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-40"
            >
              ← Previous
            </button>
            <button
              onClick={() =>
                setCurrentPage((p) =>
                  p < Math.ceil(filtered.length / itemsPerPage) ? p + 1 : p
                )
              }
              disabled={currentPage >= Math.ceil(filtered.length / itemsPerPage)}
              className="px-4 py-2 text-sm rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
