import React from "react";
import { Button } from "@/components/ui/button";
import { FaSpinner, FaSearch, FaEdit, FaTrash } from "react-icons/fa";

function TutorialsTable({
  paginatedTutorials,
  loading,
  selectedTutorials,
  toggleSelectAll,
  toggleSelectOne,
  togglePublishStatus,
  handleApproval,
  openRejectModal,
  openDeleteModal,
  setSearchQuery,
  setFilterCategory,
  setFilterStatus,
  setFilterApproval,
  setCurrentPage,
  onEdit,
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="py-4 px-4 text-left w-12">
                <input
                  type="checkbox"
                  checked={
                    paginatedTutorials.length > 0 &&
                    paginatedTutorials.every((tut) => selectedTutorials.includes(tut.id))
                  }
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
                <tr key={tutorial.id} className="hover:bg-gray-50 transition-colors">
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
                    <Button
                      onClick={() => togglePublishStatus(tutorial.id)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                        tutorial.status === "Published"
                          ? "bg-green-100 text-green-800 hover:bg-green-200"
                          : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                      }`}
                    >
                      {tutorial.status}
                    </Button>
                  </td>
                  <td className="py-3 px-4">
                    {tutorial.approvalStatus === "Pending" ? (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleApproval(tutorial.id)}
                          className="bg-green-100 hover:bg-green-200 text-green-700 text-xs px-3 py-1 rounded-full"
                        >
                          Approve
                        </Button>
                        <Button
                          onClick={() => openRejectModal(tutorial.id)}
                          className="bg-red-100 hover:bg-red-200 text-red-700 text-xs px-3 py-1 rounded-full"
                        >
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <Button
                        disabled
                        className={`px-3 py-1 rounded-full text-xs font-bold cursor-default ${
                          tutorial.approvalStatus === "Approved"
                            ? "bg-green-100 text-green-800"
                            : tutorial.approvalStatus === "Rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {tutorial.approvalStatus}
                      </Button>
                    )}
                    {tutorial.approvalStatus === "Rejected" && tutorial.rejectionReason && (
                      <div className="text-xs text-red-600 mt-1 max-w-xs truncate" title={tutorial.rejectionReason}>
                        {tutorial.rejectionReason}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <Button
                        onClick={() => onEdit(tutorial.id)}
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
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
  );
}

export default TutorialsTable;
