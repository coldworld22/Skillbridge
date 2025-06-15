import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import InstructorLayout from '@/components/layouts/InstructorLayout';
import { FaPlus, FaEdit, FaEye, FaTrash } from "react-icons/fa";
import { fetchPublishedTutorials } from "@/services/tutorialService";

export default function InstructorTutorialsPage() {
  const router = useRouter();
  const [tutorials, setTutorials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchPublishedTutorials();
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

  const filteredTutorials = tutorials.filter((tut) => {
    const matchesTitle = tut.title.toLowerCase().includes(searchQuery);
    const matchesStatus = statusFilter ? tut.status === statusFilter : true;
    return matchesTitle && matchesStatus;
  });

  if (loading) {
    return <div className="p-6">Loading tutorials...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  return (
    <InstructorLayout>
      <div className="p-6 bg-gray-100 min-h-screen">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold text-gray-800">📚 My Tutorials</h1>
          <button
            onClick={() => router.push("/dashboard/instructor/tutorials/create")}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded flex items-center"
          >
            <FaPlus className="mr-2" /> Create Tutorial
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row md:justify-between items-center mb-8 gap-4">
          <input
            type="text"
            placeholder="Search tutorials..."
            className="border border-gray-300 p-2 rounded-lg w-full md:w-1/3"
            onChange={(e) => handleSearch(e.target.value)}
          />
          <select
            className="border border-gray-300 p-2 rounded-lg w-full md:w-1/4"
            onChange={(e) => handleFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Submitted">Submitted</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {filteredTutorials.map((tutorial) => (
            <div
              key={tutorial.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col transform hover:scale-105 hover:shadow-2xl transition duration-300 ease-in-out"
            >
              <img
                src={tutorial.thumbnail}
                alt={tutorial.title}
                className="h-40 w-full object-cover"
              />

              <div className="flex-1 p-4 flex flex-col justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 truncate">{tutorial.title}</h2>
                  <p className="text-xs text-gray-500 mt-2">
                    Updated: {new Date(tutorial.updatedAt).toLocaleDateString()}
                  </p>

                  {/* Status Badge */}
                  <div className="mt-3">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                        tutorial.status === "Approved"
                          ? "bg-green-200 text-green-800"
                          : tutorial.status === "Submitted"
                          ? "bg-blue-200 text-blue-800"
                          : tutorial.status === "Draft"
                          ? "bg-yellow-200 text-yellow-800"
                          : "bg-red-200 text-red-800"
                      }`}
                    >
                      {tutorial.status}
                    </span>

                    {/* Submission Banner */}
                    {tutorial.status === "Submitted" && (
                      <div className="mt-2 bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded">
                        ⏳ Pending Approval
                      </div>
                    )}
                  </div>

                  {/* Progress bar if Draft */}
                  {tutorial.status === "Draft" && (
                    <div className="mt-4">
                      <div className="h-2 bg-gray-200 rounded-full">
                        <div
                          className="h-2 bg-yellow-500 rounded-full"
                          style={{ width: `${tutorial.progress || 40}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {tutorial.progress || 40}% completed
                      </p>
                    </div>
                  )}
                </div>

                {/* Buttons */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => router.push(`/dashboard/instructor/tutorials/${tutorial.id}/view`)}
                    title="View Tutorial"
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-sm py-2 rounded-lg"
                  >
                    <FaEye className="inline mr-1" /> View
                  </button>

                  {(tutorial.status === "Draft" || tutorial.status === "Rejected") && (
                    <button
                      onClick={() => router.push(`/dashboard/instructor/tutorials/${tutorial.id}/edit`)}
                      title="Edit Tutorial"
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm py-2 rounded-lg"
                    >
                      <FaEdit className="inline mr-1" /> Edit
                    </button>
                  )}

                  {/* Delete Option */}
                  {(tutorial.status === "Draft" || tutorial.status === "Rejected") && (
                    <button
                      onClick={() => handleDelete(tutorial.id)}
                      title="Delete Tutorial"
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm py-2 rounded-lg"
                    >
                      <FaTrash className="inline mr-1" /> Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Tutorials */}
        {filteredTutorials.length === 0 && (
          <div className="text-center text-gray-400 mt-10 flex flex-col items-center">
            <img src="/no-content.svg" alt="No Tutorials" className="w-40 h-40 mb-4" />
            No tutorials found. Try adjusting your search or filter. 🚀
          </div>
        )}
      </div>
    </InstructorLayout>
  );
}