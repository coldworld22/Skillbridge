import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import withAuthProtection from "@/hooks/withAuthProtection";
import { Button } from "@/components/ui/button";
import { FaEdit, FaTrash, FaPlus, FaSearch, FaCheck, FaTimes, FaSpinner } from "react-icons/fa";
import { toast } from "react-toastify";
import AdminLayout from "@/components/layouts/AdminLayout";
import ConfirmModal from "@/components/common/ConfirmModal";
import RejectionReasonModal from "@/components/common/RejectionReasonModal";
import { fetchAllCategories } from "@/services/admin/categoryService";
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
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterApproval, setFilterApproval] = useState("All");
  const [categories, setCategories] = useState([]);

  // Modals and Selections
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [tutorialToDelete, setTutorialToDelete] = useState(null);
  const [tutorialToReject, setTutorialToReject] = useState(null);
  const [selectedTutorials, setSelectedTutorials] = useState([]);

  // Load tutorials and categories from backend on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [tuts, cats] = await Promise.all([
          fetchAllTutorials(),
          fetchAllCategories(),
        ]);
        setTutorials(tuts);
        setCategories(cats?.data || cats || []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load tutorials");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const tutorialsPerPage = 10;

  // Filtering
  const filteredTutorials = tutorials
    .filter((tut) => {
      const matchesSearch =
        tut.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tut.instructor?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        filterCategory === "All" || tut.category === filterCategory;
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

  // Pagination controls
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Render page numbers
  const renderPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    let startPage, endPage;

    if (totalPages <= maxPagesToShow) {
      startPage = 1;
      endPage = totalPages;
    } else {
      const maxPagesBeforeCurrent = Math.floor(maxPagesToShow / 2);
      const maxPagesAfterCurrent = Math.ceil(maxPagesToShow / 2) - 1;
      
      if (currentPage <= maxPagesBeforeCurrent) {
        startPage = 1;
        endPage = maxPagesToShow;
      } else if (currentPage + maxPagesAfterCurrent >= totalPages) {
        startPage = totalPages - maxPagesToShow + 1;
        endPage = totalPages;
      } else {
        startPage = currentPage - maxPagesBeforeCurrent;
        endPage = currentPage + maxPagesAfterCurrent;
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => goToPage(i)}
          className={`px-3 py-1 rounded-md ${
            currentPage === i
              ? "bg-yellow-500 text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          {i}
        </button>
      );
    }

    return pages;
  };

  return (
    <AdminLayout>
      <div className="p-6 bg-gray-50 min-h-screen space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">📚 Manage Tutorials</h1>
            <p className="text-gray-600 mt-1">
              Create, edit, and manage all tutorials in the system
            </p>
          </div>
          <Button
            onClick={() => router.push("/dashboard/admin/tutorials/create")}
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-bold py-2.5 px-6 rounded-lg flex items-center shadow-md hover:shadow-lg transition-all"
          >
            <FaPlus className="mr-2" /> Create New Tutorial
          </Button>
        </div>

        {/* Bulk Actions */}
        {selectedTutorials.length > 0 && (
          <div className="flex flex-wrap gap-3 items-center p-4 bg-white rounded-xl shadow-md border border-yellow-100 transition-all animate-fade-in">
            <span className="font-semibold text-gray-700">
              {selectedTutorials.length} {selectedTutorials.length === 1 ? "tutorial" : "tutorials"} selected
            </span>

            <Button
              onClick={handleBulkApprove}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg flex items-center shadow"
            >
              <FaCheck className="mr-2" /> Approve Selected
            </Button>

            <Button
              onClick={handleBulkDelete}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg flex items-center shadow"
            >
              <FaTrash className="mr-2" /> Delete Selected
            </Button>

            <Button
              onClick={clearSelected}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg flex items-center border border-gray-300"
            >
              <FaTimes className="mr-2" /> Clear Selection
            </Button>
          </div>
        )}

        {/* Filters Card */}
        <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                <FaSearch />
              </div>
              <input
                type="text"
                placeholder="Search by title or instructor..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 p-2.5 w-full border rounded-lg focus:ring-2 focus:ring-yellow-300 focus:border-yellow-400"
              />
            </div>
            
            <select
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="p-2.5 border rounded-lg focus:ring-2 focus:ring-yellow-300 focus:border-yellow-400"
            >
              <option value="All">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="p-2.5 border rounded-lg focus:ring-2 focus:ring-yellow-300 focus:border-yellow-400"
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
              className="p-2.5 border rounded-lg focus:ring-2 focus:ring-yellow-300 focus:border-yellow-400"
            >
              <option value="All">All Approval</option>
              <option value="Approved">Approved</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
            </select>
            
            <Button
              onClick={() => {
                setSearchQuery("");
                setFilterCategory("All");
                setFilterStatus("All");
                setFilterApproval("All");
                setCurrentPage(1);
              }}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2.5 rounded-lg border border-gray-300"
            >
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl shadow border-l-4 border-green-500">
            <p className="text-gray-600">Total Tutorials</p>
            <p className="text-2xl font-bold">{tutorials.length}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow border-l-4 border-yellow-500">
            <p className="text-gray-600">Pending Approval</p>
            <p className="text-2xl font-bold">{tutorials.filter(t => t.approvalStatus === "Pending").length}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow border-l-4 border-blue-500">
            <p className="text-gray-600">Published</p>
            <p className="text-2xl font-bold">{tutorials.filter(t => t.status === "Published").length}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow border-l-4 border-red-500">
            <p className="text-gray-600">Drafts</p>
            <p className="text-2xl font-bold">{tutorials.filter(t => t.status === "Draft").length}</p>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="py-4 px-4 text-left w-12">
                    <input
                      type="checkbox"
                      checked={paginatedTutorials.length > 0 && paginatedTutorials.every((tut) => selectedTutorials.includes(tut.id))}
                      onChange={(e) => toggleSelectAll(e.target.checked)}
                      className="h-4 w-4 rounded text-yellow-500 focus:ring-yellow-400"
                    />
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Thumbnail</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Title</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Instructor</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Category</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Approval</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center">
                      <div className="flex justify-center">
                        <FaSpinner className="animate-spin text-yellow-500 text-3xl" />
                      </div>
                      <p className="mt-2 text-gray-600">Loading tutorials...</p>
                    </td>
                  </tr>
                ) : paginatedTutorials.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 flex items-center justify-center text-gray-400 mb-4">
                          <FaSearch className="text-2xl" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No tutorials found</h3>
                        <p className="mt-1 text-gray-500 max-w-md">
                          Try adjusting your search or filter to find what you're looking for.
                        </p>
                        <Button
                          onClick={() => {
                            setSearchQuery("");
                            setFilterCategory("All");
                            setFilterStatus("All");
                            setFilterApproval("All");
                            setCurrentPage(1);
                          }}
                          className="mt-4 bg-gray-100 hover:bg-gray-200 text-gray-800"
                        >
                          Reset Filters
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedTutorials.map((tutorial) => (
                    <tr 
                      key={tutorial.id} 
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <input
                          type="checkbox"
                          checked={selectedTutorials.includes(tutorial.id)}
                          onChange={() => toggleSelectOne(tutorial.id)}
                          className="h-4 w-4 rounded text-yellow-500 focus:ring-yellow-400"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <img
                          src={tutorial.thumbnail || "/default-thumbnail.jpg"}
                          alt={tutorial.title}
                          className="h-14 w-24 object-cover rounded-lg border"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/default-thumbnail.jpg";
                          }}
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{tutorial.title}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(tutorial.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-gray-900">{tutorial.instructor}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {tutorial.category}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          onClick={() => togglePublishStatus(tutorial.id)}
                          className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition-colors ${
                            tutorial.status === "Published"
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                          }`}
                        >
                          {tutorial.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            tutorial.approvalStatus === "Approved"
                              ? "bg-green-100 text-green-800"
                              : tutorial.approvalStatus === "Pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {tutorial.approvalStatus}
                        </span>
                        {tutorial.approvalStatus === "Rejected" && tutorial.rejectionReason && (
                          <div className="text-xs text-red-600 mt-1 max-w-xs truncate" title={tutorial.rejectionReason}>
                            {tutorial.rejectionReason}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button
                            onClick={() => router.push(`/dashboard/admin/tutorials/${tutorial.id}/edit`)}
                            className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-2 rounded-lg"
                            title="Edit"
                          >
                            <FaEdit className="text-sm" />
                          </Button>
                          <Button
                            onClick={() => openDeleteModal(tutorial.id)}
                            className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-lg"
                            title="Delete"
                          >
                            <FaTrash className="text-sm" />
                          </Button>
                          {tutorial.approvalStatus === "Pending" && (
                            <>
                              <Button
                                onClick={() => handleApproval(tutorial.id)}
                                className="bg-green-100 hover:bg-green-200 text-green-700 p-2 rounded-lg"
                                title="Approve"
                              >
                                <FaCheck className="text-sm" />
                              </Button>
                              <Button
                                onClick={() => openRejectModal(tutorial.id)}
                                className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-lg"
                                title="Reject"
                              >
                                <FaTimes className="text-sm" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredTutorials.length > 0 && !loading && (
            <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between">
              <div className="text-sm text-gray-700 mb-4 sm:mb-0">
                Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
                <span className="font-medium">{Math.min(endIndex, filteredTutorials.length)}</span> of{" "}
                <span className="font-medium">{filteredTutorials.length}</span> results
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </Button>
                
                <div className="flex space-x-1">
                  {renderPageNumbers()}
                </div>
                
                <Button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Modals */}
        <ConfirmModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={handleConfirmDelete}
          title="Confirm Deletion"
          message="Are you sure you want to permanently delete this tutorial? This action cannot be undone."
        />
        
        <RejectionReasonModal
          isOpen={isRejectionModalOpen}
          onClose={() => setIsRejectionModalOpen(false)}
          onConfirm={handleConfirmReject}
          title="Reject Tutorial"
        />
      </div>
    </AdminLayout>
  );
}

export default withAuthProtection(AdminTutorialsPage, ["admin", "superadmin"]);