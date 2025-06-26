// ✅ AdminClassesTable.js with Full Routing, Labeled Buttons, and Tooltips
import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import {
  updateAdminClass,
  deleteAdminClass,
  approveAdminClass,
  rejectAdminClass,
  toggleClassStatus,
} from "@/services/admin/classService";
import {
  FaCalendarAlt,
  FaSearch,
  FaDownload,
  FaUserGraduate,
  FaChartBar,
  FaCheck,
  FaTimes,
  FaEdit,
  FaTrash,
  FaChevronLeft,
  FaChevronRight
} from "react-icons/fa";


export default function AdminClassesTable({ classes = [], loading = false }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterApproval, setFilterApproval] = useState("All");
  const [sortKey, setSortKey] = useState("start_date");
  const [classList, setClassList] = useState(classes);
  const [modalClass, setModalClass] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  useEffect(() => {
    setClassList(classes);
  }, [classes]);

  const filteredClasses = classList
    .filter((cls) =>
      cls.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.instructor.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((cls) =>
      filterStatus === "All" ? true : cls.scheduleStatus === filterStatus
    )
    .filter((cls) =>
      filterApproval === "All" ? true : cls.approvalStatus === filterApproval
    )
    .sort((a, b) => (a[sortKey] > b[sortKey] ? 1 : -1));

  const totalPages = Math.ceil(filteredClasses.length / itemsPerPage);
  const paginatedClasses = filteredClasses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const exportCSV = () => {
    const headers = ["Title", "Instructor", "Start Date", "End Date", "Category", "Status"];
    const rows = classList.map(cls => [
      cls.title,
      cls.instructor,
      cls.start_date,
      cls.end_date,
      cls.category,
      cls.status
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "online_classes.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Classes exported");
  };

  
  const handleStatusChange = async (id, action, reason = "") => {
    try {

      if (action === "approve") {
        const updated = await approveAdminClass(id);
        setClassList((prev) =>
          prev.map((c) =>
            c.id === id
              ? { ...c, approvalStatus: "Approved", status: updated?.status }
              : c
          )
        );
        toast.success("Class approved");
      } else if (action === "reject") {
        await rejectAdminClass(id, reason);
        setClassList((prev) =>
          prev.map((c) =>
            c.id === id ? { ...c, approvalStatus: "Rejected" } : c
          )
        );
        toast.success("Class rejected");
      } else if (action === "toggle") {
        const updated = await toggleClassStatus(id);
        setClassList((prev) =>
          prev.map((c) =>
            c.id === id ? { ...c, status: updated.status } : c
          )
        );
        toast.success("Status updated");
      }

    } catch (err) {
      console.error(err);
      toast.error("Failed to update class");
    } finally {
      setModalClass(null);
    }
  };

  const handleDeleteClass = async (id) => {
    try {
      await deleteAdminClass(id);
      setClassList(prev => prev.filter(cls => cls.id !== id));
      toast.success("Class deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete class");
    } finally {
      setModalClass(null);
    }
  };

  const handlePrev = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const handleNext = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100 text-center">
        Loading classes...
      </div>
    );
  }

  if (!classList.length) {
    return (
      <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100 text-center">
        No classes found.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div className="flex items-center gap-2 w-full sm:w-1/2">
          <FaSearch className="text-gray-400" />
          <input
            type="text"
            placeholder="Search by title or instructor"
            className="border border-gray-300 rounded-xl px-4 py-2 w-full text-sm focus:ring-2 focus:ring-yellow-500"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-1/2 justify-end items-center">
          <select
            className="border border-gray-300 rounded-xl px-4 py-2 text-sm"
            onChange={(e) => setFilterStatus(e.target.value)}
            value={filterStatus}
          >
            <option value="All">All Schedule</option>
            <option value="Upcoming">Upcoming</option>
            <option value="Ongoing">Ongoing</option>
            <option value="Completed">Completed</option>
          </select>
          <select
            className="border border-gray-300 rounded-xl px-4 py-2 text-sm"
            onChange={(e) => setFilterApproval(e.target.value)}
            value={filterApproval}
          >
            <option value="All">All Approval</option>
            <option value="Approved">Approved</option>
            <option value="Pending">Pending</option>
            <option value="Rejected">Rejected</option>
          </select>
          <select
            className="border border-gray-300 rounded-xl px-4 py-2 text-sm"
            onChange={(e) => setSortKey(e.target.value)}
          >
            <option value="start_date">Sort by Start Date</option>
            <option value="title">Sort by Title</option>
            <option value="instructor">Sort by Instructor</option>
          </select>
          <select
            value={itemsPerPage}
            onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
            className="border border-gray-300 rounded-xl px-2 py-2 text-sm"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={filteredClasses.length}>All</option>
          </select>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-xl px-4 py-2"
            title="Export all classes to CSV"
          >
            <FaDownload /> Export
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-700 text-sm uppercase">
            <tr>
              <th className="px-6 py-3 text-left">Image</th>
              <th className="px-6 py-3 text-left">Title</th>
              <th className="px-6 py-3 text-left">Instructor</th>
              <th className="px-6 py-3 text-left">Start Date</th>
              <th className="px-6 py-3 text-left">End Date</th>
              <th className="px-6 py-3 text-left">Category</th>
              <th className="px-6 py-3 text-left">Price</th>
              <th className="px-6 py-3 text-left">Schedule</th>
              <th className="px-6 py-3 text-left">Publish</th>
              <th className="px-6 py-3 text-left">Approval</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedClasses.map((cls) => (
              <tr key={cls.id} className="hover:bg-yellow-50">
                <td className="px-6 py-4">
                  {cls.cover_image && (
                    <img
                      src={cls.cover_image}
                      alt={cls.title}
                      className="w-12 h-12 object-cover rounded"
                    />
                  )}
                </td>
                <td className="px-6 py-4 font-semibold">{cls.title}</td>
                <td className="px-6 py-4">{cls.instructor}</td>
                <td className="px-6 py-4">{cls.start_date}</td>
                <td className="px-6 py-4">{cls.end_date || '-'}</td>
                <td className="px-6 py-4">{cls.category || '-'}</td>
                <td className="px-6 py-4">${cls.price ?? '-'}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${{
                    Upcoming: 'bg-green-100 text-green-800',
                    Ongoing: 'bg-blue-100 text-blue-800',
                    Completed: 'bg-gray-300 text-gray-800'
                  }[cls.scheduleStatus] || 'bg-gray-200 text-gray-800'}`}
                  >
                    {cls.scheduleStatus}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    onClick={() => handleStatusChange(cls.id, 'toggle')}
                    className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer ${
                      cls.status === 'published'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {cls.status === 'published' ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${{
                    Approved: 'bg-green-100 text-green-800',
                    Pending: 'bg-yellow-100 text-yellow-700',
                    Rejected: 'bg-red-100 text-red-700'
                  }[cls.approvalStatus] || 'bg-gray-100 text-gray-700'}`}
                  >
                    {cls.approvalStatus}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-1 space-y-1">
                  <button title="Approve Class"
                    onClick={() => handleStatusChange(cls.id, 'approve')}
                    className="bg-green-500 hover:bg-green-600 text-white text-xs px-2 py-1 rounded shadow">
                    <FaCheck className="w-4 h-4" />
                  </button>
                  <button title="Reject Class"
                    onClick={() => { setModalClass(cls); setModalType('reject'); setRejectionReason(''); }}
                    className="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded shadow">
                    <FaTimes className="w-4 h-4" />
                  </button>
                  <Link href={`/dashboard/admin/online-classes/edit/${cls.id}`} title="Manage Class">
                    <button className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-1 rounded shadow">
                      <FaEdit className="w-4 h-4" />
                    </button>
                  </Link>
                  <button title="Delete Class"
                    onClick={() => { setModalClass(cls); setModalType('delete'); }}
                    className="bg-gray-600 hover:bg-gray-700 text-white text-xs px-2 py-1 rounded shadow">
                    <FaTrash className="w-4 h-4" />
                  </button>
                  <Link href={`/dashboard/admin/online-classes/${cls.id}/students`} title="View Enrolled Students">
                    <button className="bg-indigo-500 hover:bg-indigo-600 text-white text-xs px-2 py-1 rounded shadow">
                      <FaUserGraduate className="w-4 h-4" />
                    </button>
                  </Link>
                  <Link href={`/dashboard/admin/online-classes/${cls.id}`} title="View Class Details">
                    <button className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs px-2 py-1 rounded shadow">
                      <FaCalendarAlt className="w-4 h-4" />
                    </button>
                  </Link>
                  <Link href={`/dashboard/admin/online-classes/${cls.id}/analytics`}>
                    <button
                      title="View Analytics"
                      className="bg-purple-500 hover:bg-yellow-600 text-white text-xs px-2 py-1 rounded shadow"
                    >
                      <FaChartBar className="w-4 h-4" /> Analytics
                    </button>
                  </Link>

                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-500">
            Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredClasses.length)} of {filteredClasses.length} classes
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrev} disabled={currentPage === 1} className="text-sm px-3 py-1 bg-gray-200 hover:bg-yellow-100 rounded disabled:opacity-50">
              <FaChevronLeft />
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`text-sm px-3 py-1 rounded ${currentPage === i + 1 ? 'bg-yellow-500 text-white' : 'bg-gray-100 hover:bg-yellow-100'}`}
              >
                {i + 1}
              </button>
            ))}
            <button onClick={handleNext} disabled={currentPage === totalPages} className="text-sm px-3 py-1 bg-gray-200 hover:bg-yellow-100 rounded disabled:opacity-50">
              <FaChevronRight />
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalClass && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl text-center">
            <h2 className="text-xl font-bold mb-2">{modalType === 'reject' ? 'Confirm Rejection' : 'Confirm Deletion'}</h2>
            <p className="mb-4 text-gray-600">Are you sure you want to {modalType} <strong>{modalClass.title}</strong>?</p>
            {modalType === 'reject' && (
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 mb-4"
                placeholder="Enter rejection reason"
              />
            )}
            <div className="flex justify-center gap-4">
              <button onClick={() => setModalClass(null)} className="bg-gray-200 px-4 py-2 rounded">Cancel</button>
              <button
                onClick={() => modalType === 'reject'
                  ? handleStatusChange(modalClass.id, 'reject', rejectionReason)
                  : handleDeleteClass(modalClass.id)}
                className={`px-4 py-2 rounded text-white ${modalType === 'reject' ? 'bg-red-600' : 'bg-gray-800'}`}
              >
                Yes, {modalType === 'reject' ? 'Reject' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
