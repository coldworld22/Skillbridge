import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import InstructorLayout from '@/components/layouts/InstructorLayout';
import {
  FaPlus,
  FaEdit,
  FaEye,
  FaTrash,
  FaRegEye,
  FaRegComments,
  FaStar,
  FaUsers,
  FaCopy,
  FaDownload,
  FaSearch,
  FaFilter,
  FaSortAmountDown
} from "react-icons/fa";
import {
  fetchInstructorTutorials,
  submitTutorialForReview,
} from "@/services/instructor/tutorialService";
import ProgressChecklistModal from "@/components/tutorials/ProgressChecklistModal";

export default function InstructorTutorialsPage() {
  const router = useRouter();
  const [tutorials, setTutorials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [checklistTutorial, setChecklistTutorial] = useState(null);
  const [showChecklist, setShowChecklist] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchInstructorTutorials();
        setTutorials(data?.data || data || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load tutorials");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSearch = (query) => {
    setSearchQuery(query.toLowerCase());
  };

  const handleFilter = (status) => {
    setStatusFilter(status);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this tutorial?")) {
      setTutorials((prev) => prev.filter((tut) => tut.id !== id));
    }
  };

  const filteredTutorials = tutorials
    .filter((tut) => {
      const matchesTitle = tut.title.toLowerCase().includes(searchQuery);
      const matchesStatus = statusFilter ? tut.status === statusFilter : true;
      return matchesTitle && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "views") return b.views - a.views;
      if (sortBy === "enrollments") return b.enrollments - a.enrollments;
      if (sortBy === "oldest")
        return new Date(a.createdAt) - new Date(b.createdAt);
      return new Date(b.createdAt) - new Date(a.createdAt); // newest
    });

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-500 bg-red-50 rounded-lg max-w-md mx-auto mt-10 text-center">
        {error}
      </div>
    );
  }

  return (
    <InstructorLayout>
      <div className="p-4 md:p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between items-center mb-8 gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold text-gray-800 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              My Tutorials
            </h1>
            <p className="text-gray-600 mt-1">
              Manage and create your educational content
            </p>
          </div>
          <button
            onClick={() => router.push("/dashboard/instructor/tutorials/create")}
            className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-bold py-3 px-6 rounded-xl flex items-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <FaPlus className="mr-2" /> Create Tutorial
          </button>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-2xl p-5 mb-8 shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search tutorials..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaFilter className="text-gray-400" />
              </div>
              <select
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                onChange={(e) => handleFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Submitted">Submitted</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSortAmountDown className="text-gray-400" />
              </div>
              <select
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Sort: Newest</option>
                <option value="oldest">Oldest</option>
                <option value="views">Most Viewed</option>
                <option value="enrollments">Most Enrolled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="text-sm text-gray-500">Total Tutorials</div>
            <div className="text-2xl font-bold text-indigo-600">{tutorials.length}</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="text-sm text-gray-500">Published</div>
            <div className="text-2xl font-bold text-green-600">
              {tutorials.filter(t => t.status === 'Approved').length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="text-sm text-gray-500">Drafts</div>
            <div className="text-2xl font-bold text-yellow-600">
              {tutorials.filter(t => t.status === 'Draft').length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="text-sm text-gray-500">Pending</div>
            <div className="text-2xl font-bold text-blue-600">
              {tutorials.filter(t => t.status === 'Submitted').length}
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTutorials.map((tutorial) => (
            <div
              key={tutorial.id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl border border-gray-100"
            >
              <div className="relative">
                <img
                  src={tutorial.thumbnail || "/default-thumbnail.jpg"}
                  alt={tutorial.title}
                  className="h-48 w-full object-cover"
                />
                <div className="absolute top-3 right-3">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                      tutorial.status === "Approved"
                        ? "bg-green-100 text-green-800"
                        : tutorial.status === "Submitted"
                        ? "bg-blue-100 text-blue-800"
                        : tutorial.status === "Draft"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {tutorial.status}
                  </span>
                </div>
              </div>

              <div className="flex-1 p-5 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <h2 className="text-lg font-bold text-gray-800 line-clamp-2">
                      {tutorial.title}
                    </h2>
                    <span className="font-bold text-indigo-700 whitespace-nowrap ml-2">
                      {tutorial.price ? `$${tutorial.price}` : "Free"}
                    </span>
                  </div>
                  
                  <div className="flex items-center mt-2 text-sm text-gray-600">
                    <span className="mr-3">
                      {new Date(tutorial.updatedAt).toLocaleDateString()}
                    </span>
                    <div className="h-1 w-1 bg-gray-400 rounded-full mr-3"></div>
                    <span>{tutorial.language || "English"}</span>
                  </div>
                  
                  <div className="mt-3 flex flex-wrap gap-1">
                    <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md text-xs">
                      {tutorial.category_name || "General"}
                    </span>
                    <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded-md text-xs">
                      {tutorial.level || "All Levels"}
                    </span>
                  </div>
                  
                  {tutorial.tags && tutorial.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {tutorial.tags.map((tag) => (
                        <span
                          key={tag.id || tag}
                          className="bg-gray-100 px-2 py-1 rounded-md text-xs text-gray-700"
                        >
                          {tag.name || tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-2 mt-4 text-center">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <FaRegEye className="mx-auto text-blue-500" />
                      <span className="text-xs mt-1">{tutorial.views}</span>
                    </div>
                    <div className="p-2 bg-green-50 rounded-lg">
                      <FaUsers className="mx-auto text-green-500" />
                      <span className="text-xs mt-1">{tutorial.enrollments}</span>
                    </div>
                    <div className="p-2 bg-yellow-50 rounded-lg">
                      <FaStar className="mx-auto text-yellow-500" />
                      <span className="text-xs mt-1">{tutorial.rating}</span>
                    </div>
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <FaRegComments className="mx-auto text-purple-500" />
                      <span className="text-xs mt-1">{tutorial.comments}</span>
                    </div>
                  </div>
                  
                  {/* Progress bar if Draft */}
                  {tutorial.status === "Draft" && (
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{tutorial.progress || 40}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-2 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full"
                          style={{ width: `${tutorial.progress || 40}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  {/* Submission Banner */}
                  {tutorial.status === "Submitted" && (
                    <div className="mt-4 bg-blue-50 text-blue-700 text-xs font-medium px-3 py-2 rounded-lg">
                      ⏳ Pending Approval
                    </div>
                  )}
                  {tutorial.status === "Rejected" && tutorial.rejection_reason && (
                    <div className="mt-4 bg-red-50 text-red-700 text-xs font-medium px-3 py-2 rounded-lg">
                      ❌ {tutorial.rejection_reason}
                    </div>
                  )}
                </div>

                {/* Buttons */}
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <button
                    onClick={() =>
                      router.push(`/dashboard/instructor/tutorials/${tutorial.id}/view`)
                    }
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-3 rounded-lg text-sm flex items-center justify-center transition-colors"
                  >
                    <FaEye className="mr-2" /> View
                  </button>

                  {(tutorial.status === "Draft" || tutorial.status === "Rejected") && (
                    <button
                      onClick={() =>
                        router.push(`/dashboard/instructor/tutorials/${tutorial.id}/edit`)
                      }
                      className="bg-green-100 hover:bg-green-200 text-green-800 py-2 px-3 rounded-lg text-sm flex items-center justify-center transition-colors"
                    >
                      <FaEdit className="mr-2" /> Edit
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setChecklistTutorial(tutorial);
                      setShowChecklist(true);
                    }}
                    className="bg-indigo-100 hover:bg-indigo-200 text-indigo-800 py-2 px-3 rounded-lg text-sm flex items-center justify-center transition-colors"
                  >
                    <span className="mr-2">📋</span> Checklist
                  </button>

                  {tutorial.status === "Draft" && tutorial.progress === 100 && (
                    <button
                      onClick={async () => {
                        await submitTutorialForReview(tutorial.id);
                        setTutorials((prev) =>
                          prev.map((t) =>
                            t.id === tutorial.id ? { ...t, status: "Submitted" } : t
                          )
                        );
                      }}
                      className="bg-purple-100 hover:bg-purple-200 text-purple-800 py-2 px-3 rounded-lg text-sm flex items-center justify-center transition-colors"
                    >
                      Submit
                    </button>
                  )}

                  {(tutorial.status === "Draft" || tutorial.status === "Rejected") && (
                    <button
                      onClick={() => handleDelete(tutorial.id)}
                      className="bg-red-100 hover:bg-red-200 text-red-800 py-2 px-3 rounded-lg text-sm flex items-center justify-center transition-colors"
                    >
                      <FaTrash className="mr-2" /> Delete
                    </button>
                  )}

                  <button
                    onClick={() => {
                      const copy = { ...tutorial, id: `copy-${Date.now()}` };
                      setTutorials((prev) => [copy, ...prev]);
                    }}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-3 rounded-lg text-sm flex items-center justify-center transition-colors"
                  >
                    <FaCopy className="mr-2" /> Duplicate
                  </button>

                  <button
                    onClick={() => {
                      const dataStr =
                        "data:text/json;charset=utf-8," +
                        encodeURIComponent(JSON.stringify(tutorial, null, 2));
                      const a = document.createElement("a");
                      a.href = dataStr;
                      a.download = `${tutorial.slug || tutorial.id}.json`;
                      a.click();
                    }}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-3 rounded-lg text-sm flex items-center justify-center transition-colors"
                  >
                    <FaDownload className="mr-2" /> Export
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Tutorials */}
        {filteredTutorials.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-white p-8 rounded-2xl shadow-sm max-w-md mx-auto">
              <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mx-auto flex items-center justify-center text-gray-400 mb-4">
                <FaPlus className="text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No tutorials found</h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your search or create a new tutorial
              </p>
              <button
                onClick={() => router.push("/dashboard/instructor/tutorials/create")}
                className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-medium py-2 px-6 rounded-xl inline-flex items-center shadow transition-all"
              >
                <FaPlus className="mr-2" /> Create First Tutorial
              </button>
            </div>
          </div>
        )}
      </div>
      <ProgressChecklistModal
        isOpen={showChecklist}
        onClose={() => setShowChecklist(false)}
        tutorial={checklistTutorial}
      />
    </InstructorLayout>
  );
}