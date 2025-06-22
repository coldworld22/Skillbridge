import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import withAuthProtection from "@/hooks/withAuthProtection";
import { Button } from "@/components/ui/button";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import toast, { Toaster } from "react-hot-toast";
import AdminLayout from "@/components/layouts/AdminLayout";
import ConfirmModal from "@/components/common/ConfirmModal";
import RejectionReasonModal from "@/components/common/RejectionReasonModal";
import {
  fetchAllTutorials,
  permanentlyDeleteTutorial,
  toggleTutorialStatus,
  approveTutorial,
  rejectTutorial,
  bulkApproveTutorials,
  bulkDeleteTutorials,
} from "@/services/admin/tutorialService";


function AdminTutorialsPage() {
  const router = useRouter();
  const [tutorials, setTutorials] = useState([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterApproval, setFilterApproval] = useState("All");

  // Modals and Selections
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [tutorialToDelete, setTutorialToDelete] = useState(null);
  const [tutorialToReject, setTutorialToReject] = useState(null);
  const [selectedTutorials, setSelectedTutorials] = useState([]);

  // Load tutorials from backend on mount
  useEffect(() => {
    const loadTutorials = async () => {
      try {
        const data = await fetchAllTutorials();
        setTutorials(data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load tutorials");
      }
    };

    loadTutorials();
  }, []);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const tutorialsPerPage = 5;

  // Filtering
  const filteredTutorials = tutorials
    .filter((tut) => {
      const matchesSearch =
        tut.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tut.instructor?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory === "All" || tut.category === filterCategory;
      const matchesStatus = filterStatus === "All" || tut.status === filterStatus;
      const matchesApproval = filterApproval === "All" || tut.approvalStatus === filterApproval;
      return matchesSearch && matchesCategory && matchesStatus && matchesApproval;
    });

  const totalPages = Math.ceil(filteredTutorials.length / tutorialsPerPage);
  const startIndex = (currentPage - 1) * tutorialsPerPage;
  const endIndex = startIndex + tutorialsPerPage;
  const paginatedTutorials = filteredTutorials.slice(startIndex, endIndex);

  // Functions
  const toggleSelectOne = (id) => {
    setSelectedTutorials((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = (isChecked) => {
    if (isChecked) {
      const pageIds = paginatedTutorials.map((tut) => tut.id);
      setSelectedTutorials((prevSelected) => [
        ...new Set([...prevSelected, ...pageIds]), // Add only current page IDs
      ]);
    } else {
      const pageIds = paginatedTutorials.map((tut) => tut.id);
      setSelectedTutorials((prevSelected) =>
        prevSelected.filter((id) => !pageIds.includes(id)) // Remove only current page IDs
      );
    }
  };


  const clearSelected = () => setSelectedTutorials([]);

  const togglePublishStatus = async (id) => {
    try {
      await toggleTutorialStatus(id);
      setTutorials((prev) =>
        prev.map((tut) =>
          tut.id === id
            ? {
                ...tut,
                status: tut.status === "Published" ? "Draft" : "Published",
                updatedAt: new Date().toISOString(),
              }
            : tut
        )
      );
      toast.success("Tutorial status updated!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    }
  };

  const openDeleteModal = (id) => {
    setTutorialToDelete(id);
    setIsModalOpen(true);
  };

  const openRejectModal = (id) => {
    setTutorialToReject(id);
    setIsRejectionModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!tutorialToDelete) return;
    try {
      await permanentlyDeleteTutorial(tutorialToDelete);
      setTutorials((prev) => prev.filter((tut) => tut.id !== tutorialToDelete));
      toast.success("Tutorial deleted!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete tutorial");
    } finally {
      setSelectedTutorials((prev) => prev.filter((id) => id !== tutorialToDelete));
      setTutorialToDelete(null);
      setIsModalOpen(false);
    }
  };

  const handleConfirmReject = async (reason) => {
    try {
      await rejectTutorial(tutorialToReject, reason);
      setTutorials((prev) =>
        prev.map((tut) =>
          tut.id === tutorialToReject
            ? {
                ...tut,
                approvalStatus: "Rejected",
                rejectionReason: reason,
                updatedAt: new Date().toISOString(),
              }
            : tut
        )
      );
      toast.success("Tutorial rejected with reason!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to reject tutorial");
    } finally {
      setIsRejectionModalOpen(false);
      setTutorialToReject(null);
    }
  };

  const handleApproval = async (id) => {
    try {
      await approveTutorial(id);
      setTutorials((prev) =>
        prev.map((tut) =>
          tut.id === id ? { ...tut, approvalStatus: "Approved", updatedAt: new Date().toISOString() } : tut
        )
      );
      toast.success("Tutorial approved successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update tutorial");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTutorials.length === 0) return;
    try {
      await bulkDeleteTutorials(selectedTutorials);
      setTutorials((prev) => prev.filter((tut) => !selectedTutorials.includes(tut.id)));
      toast.success("Selected tutorials deleted!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete tutorials");
    } finally {
      setSelectedTutorials([]);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedTutorials.length === 0) return;
    try {
      await bulkApproveTutorials(selectedTutorials);
      setTutorials((prev) =>
        prev.map((tut) =>
          selectedTutorials.includes(tut.id)
            ? { ...tut, approvalStatus: "Approved", updatedAt: new Date().toISOString() }
            : tut
        )
      );
      toast.success("Selected tutorials approved!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to approve tutorials");
    }
    setSelectedTutorials([]);
  };

  return (
    <AdminLayout>
      <Toaster position="top-center" />
      <div className="p-6 bg-gray-100 min-h-screen space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-800">📚 Manage Tutorials</h1>
          <Button
            onClick={() => router.push("/dashboard/admin/tutorials/create")}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded flex items-center"
          >
            <FaPlus className="mr-2" /> Create New Tutorial
          </Button>
        </div>

        {/* Bulk Actions */}
        {selectedTutorials.length > 0 && (
          <div className="flex flex-wrap gap-3 items-center p-4 bg-white rounded-lg shadow transition-all animate-fade-in">
            <span className="font-semibold text-gray-700">
              {selectedTutorials.length} selected
            </span>

            <Button
              onClick={handleBulkApprove}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
              disabled={selectedTutorials.length === 0}
            >
              ✅ Approve Selected
            </Button>

            <Button
              onClick={handleBulkDelete}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
              disabled={selectedTutorials.length === 0}
            >
              🗑️ Delete Selected
            </Button>

            <Button
              onClick={clearSelected}
              className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded"
            >
              ✖️ Clear Selection
            </Button>
          </div>
        )}


        {/* Filters */}
        <div className="flex flex-col md:flex-row flex-wrap gap-4">
          <input
            type="text"
            placeholder="🔍 Search by title or instructor..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="p-2 border rounded flex-1 min-w-[200px]"
          />
          <select
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="p-2 border rounded"
          >
            <option value="All">All Categories</option>
            <option value="React">React</option>
            <option value="Node.js">Node.js</option>
            <option value="AI">AI</option>
            <option value="Design">Design</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="p-2 border rounded"
          >
            <option value="All">All Status</option>
            <option value="Published">Published</option>
            <option value="Draft">Draft</option>
          </select>
          <select
            value={filterApproval}
            onChange={(e) => {
              setFilterApproval(e.target.value);
              setCurrentPage(1);
            }}
            className="p-2 border rounded"
          >
            <option value="All">All Approval</option>
            <option value="Approved">Approved</option>
            <option value="Pending">Pending</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>


        {/* TABLE */}
        <div className="overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-200 text-gray-700">
            <tr>
              <th className="py-3 px-4">
                <input
                  type="checkbox"
                  checked={paginatedTutorials.length > 0 && paginatedTutorials.every((tut) => selectedTutorials.includes(tut.id))}
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                  className="form-checkbox h-5 w-5 text-yellow-500"
                />
              </th>
              <th className="py-3 px-4 text-left">Thumbnail</th>
              <th className="py-3 px-4 text-left">Created</th>
              <th className="py-3 px-4 text-left">Updated</th>
              <th className="py-3 px-4 text-left">Title</th>
              <th className="py-3 px-4 text-left">Instructor</th>
              <th className="py-3 px-4 text-left">Category</th>
              <th className="py-3 px-4 text-left">Rating</th>
              <th className="py-3 px-4 text-left">Views</th>
              <th className="py-3 px-4 text-left">Status</th>
              <th className="py-3 px-4 text-left">Approval</th>
              <th className="py-3 px-4 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedTutorials.map((tutorial) => (
              <tr key={tutorial.id} className="border-t hover:bg-gray-50">
                <td className="py-3 px-4">
                  <input
                    type="checkbox"
                    checked={selectedTutorials.includes(tutorial.id)}
                    onChange={() => toggleSelectOne(tutorial.id)}
                    className="form-checkbox h-5 w-5 text-yellow-500"
                  />
                </td>
                <td className="py-3 px-4">
                  <img
                    src={tutorial.thumbnail}
                    alt={tutorial.title}
                    className="h-14 w-24 object-cover rounded"
                  />
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  {new Date(tutorial.createdAt).toLocaleDateString()}
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  {new Date(tutorial.updatedAt).toLocaleDateString()}
                </td>
                <td className="py-3 px-4">{tutorial.title}</td>
                <td className="py-3 px-4">{tutorial.instructor}</td>
                <td className="py-3 px-4">{tutorial.category}</td>
                <td className="py-3 px-4">{tutorial.rating}</td>
                <td className="py-3 px-4">{tutorial.views}</td>
                <td className="py-3 px-4">
                  <span
                    onClick={() => togglePublishStatus(tutorial.id)}
                    className={`px-2 py-1 rounded-full text-xs font-bold cursor-pointer ${tutorial.status === "Published"
                        ? "bg-green-200 text-green-800"
                        : "bg-yellow-200 text-yellow-800"
                      }`}
                  >
                    {tutorial.status}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-bold ${tutorial.approvalStatus === "Approved"
                        ? "bg-green-200 text-green-800"
                        : tutorial.approvalStatus === "Pending"
                          ? "bg-yellow-200 text-yellow-800"
                          : "bg-red-200 text-red-800"
                      }`}
                  >
                    {tutorial.approvalStatus}
                  </span>
                </td>
                <td className="py-3 px-4 flex gap-2 flex-wrap">
                  <button
                    onClick={() => router.push(`/dashboard/admin/tutorials/${tutorial.id}/edit`)}
                    className="text-blue-500 hover:text-blue-700"
                    title="Edit"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => openDeleteModal(tutorial.id)}
                    className="text-red-500 hover:text-red-700"
                    title="Delete"
                  >
                    <FaTrash />
                  </button>
                  {tutorial.approvalStatus === "Pending" && (
                    <>
                      <button
                        onClick={() => handleApproval(tutorial.id)}
                        className="text-green-500 hover:text-green-700"
                        title="Approve"
                      >
                        ✅
                      </button>
                      <button
                        onClick={() => openRejectModal(tutorial.id)}
                        className="text-red-500 hover:text-red-700"
                        title="Reject"
                      >
                        ❌
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}

            {/* No Tutorials Found */}
            {paginatedTutorials.length === 0 && (
              <tr>
                <td colSpan="12" className="text-center py-8 text-gray-500">
                  No tutorials found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>


        {/* Modals */}
        <ConfirmModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={handleConfirmDelete}
          message="Are you sure you want to delete this tutorial?"
        />
        <RejectionReasonModal
          isOpen={isRejectionModalOpen}
          onClose={() => setIsRejectionModalOpen(false)}
          onConfirm={handleConfirmReject}
        />
      </div>
    </AdminLayout>
  );
}

export default withAuthProtection(AdminTutorialsPage, ["admin", "superadmin"]);
