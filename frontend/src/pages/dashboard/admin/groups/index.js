import { useEffect, useState } from 'react';
import useDebounce from '@/hooks/useDebounce';
import AdminLayout from '@/components/layouts/AdminLayout';
import Link from 'next/link';
import {
  FaTrashAlt,
  FaEye,
  FaToggleOn,
  FaToggleOff,
  FaDownload,
  FaCheckSquare,
  FaRegSquare,
} from 'react-icons/fa';
import groupService from '@/services/groupService';
import toast from 'react-hot-toast';
import ConfirmModal from '@/components/common/ConfirmModal';

const imagePool = [
  'https://media.npr.org/assets/img/2012/01/25/newnewearth_wide-e15c88c202099fecf4a9d6f6f0e2a19826d9a26f.jpg?s=1400&c=100&f=jpeg',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRE-jRZ8r7TmUYfX4yqoiabzWXlqMiU4mZbxw&s',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTFsWQ2eTVL1xGadTXxeFlmMgNmWr31H7CmRg&s',
];


export default function AdminGroupsIndex() {
  const [groups, setGroups] = useState([]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOption, setSortOption] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    cancelText: '',
    onConfirm: () => {},
  });
  const itemsPerPage = 6;

  const openConfirmModal = ({
    title,
    message,
    confirmText,
    cancelText,
    onConfirm,
  }) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText,
      onConfirm,
    });
  };

  const closeConfirmModal = () => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
  };

  const sortGroups = (list) => {
    const sorted = [...list];
    switch (sortOption) {
      case 'oldest':
        sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'members':
        sorted.sort((a, b) => b.membersCount - a.membersCount);
        break;
      default:
        sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return sorted;
  };

  useEffect(() => {
    groupService
      .getAllGroups(search, statusFilter)
      .then((data) => setGroups(sortGroups(data)))
      .catch(() => setGroups([]));
  }, [search, statusFilter]);

  useEffect(() => {
    setGroups((prev) => sortGroups(prev));
  }, [sortOption]);

  const toggleStatus = async (id, newStatus) => {
    try {
      await groupService.updateGroup(id, { status: newStatus });
      setGroups((prev) =>
        prev.map((g) => (g.id === id ? { ...g, status: newStatus } : g))
      );
      toast.success(`Group status set to ${newStatus}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = (id) => {
    openConfirmModal({
      title: 'Delete Group',
      message: 'Are you sure you want to delete this group?',
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          await groupService.deleteGroup(id);
          toast.success('Group deleted');
        } catch {
          toast.error('Failed to delete group');
        }
        setGroups((prev) => prev.filter((g) => g.id !== id));
        setSelectedGroups((prev) => prev.filter((gid) => gid !== id));
      },
    });
  };

  const handleBulkDelete = () => {
    if (selectedGroups.length === 0) return;
    openConfirmModal({
      title: 'Delete Selected Groups',
      message: 'Delete selected groups?',
      confirmText: 'Delete',
      onConfirm: async () => {
        const results = await Promise.allSettled(
          selectedGroups.map((gid) => groupService.deleteGroup(gid))
        );
        const failed = results.filter((r) => r.status === 'rejected').length;
        if (failed) toast.error(`Failed to delete ${failed} groups`);
        setGroups((prev) => prev.filter((g) => !selectedGroups.includes(g.id)));
        setSelectedGroups([]);
        toast.success('Selected groups deleted');
      },
    });
  };

  const handleBulkStatusChange = (status) => {
    if (selectedGroups.length === 0) return;
    openConfirmModal({
      title: 'Change Status',
      message: `Change status of selected groups to ${status}?`,
      confirmText: 'Confirm',
      onConfirm: async () => {
        const results = await Promise.allSettled(
          selectedGroups.map((gid) => groupService.updateGroup(gid, { status }))
        );
        const failed = results.filter((r) => r.status === 'rejected').length;
        if (failed) toast.error(`Failed to update ${failed} groups`);
        setGroups((prev) =>
          prev.map((g) =>
            selectedGroups.includes(g.id) ? { ...g, status } : g
          )
        );
        setSelectedGroups([]);
        toast.success(`Status updated to ${status} for selected groups`);
      },
    });
  };

  const exportToCSV = () => {
    const header = ['ID', 'Name', 'Status', 'Members', 'Public', 'CreatedAt'];
    const rows = groups.map(g => [g.id, g.name, g.status ?? 'active', g.membersCount, g.isPublic, g.createdAt]);
    const csvContent = [header, ...rows].map(e => e.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'groups.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const toggleSelect = (id) => {
    setSelectedGroups((prev) =>
      prev.includes(id) ? prev.filter((gid) => gid !== id) : [...prev, id]
    );
  };

  const selectAllOnPage = (groupIds) => {
    const allSelected = groupIds.every((id) => selectedGroups.includes(id));
    setSelectedGroups((prev) =>
      allSelected ? prev.filter((id) => !groupIds.includes(id)) : [...new Set([...prev, ...groupIds])]
    );
  };

  const totalPages = Math.ceil(groups.length / itemsPerPage);
  const paginatedGroups = groups.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const pageGroupIds = paginatedGroups.map(g => g.id);

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <h1 className="text-2xl font-bold">📋 Group Management</h1>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search by name or creator..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="p-2 border rounded-md w-full md:w-64"
            />
            <button
              onClick={exportToCSV}
              className="flex items-center gap-1 px-3 py-2 bg-gray-200 rounded text-sm hover:bg-gray-300"
            >
              <FaDownload /> Export CSV
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 border rounded-md"
          >
            <option value="all">All Statuses</option>
            <option value="pending">🕓 Pending</option>
            <option value="active">✅ Active</option>
            <option value="inactive">⏸ Inactive</option>
            <option value="suspended">🚫 Suspended</option>
          </select>

        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
          className="p-2 border rounded-md"
        >
          <option value="newest">📅 Newest</option>
          <option value="oldest">📆 Oldest</option>
          <option value="members">👥 Most Members</option>
        </select>

        <Link href="/dashboard/admin/groups/create">
          <button className="ml-auto border px-4 py-2 rounded text-sm bg-yellow-400 text-white hover:bg-yellow-500">
            + Create Group
          </button>
        </Link>

          {selectedGroups.length > 0 && (
            <>
              <button
                onClick={handleBulkDelete}
                className="bg-red-500 text-white px-3 py-2 rounded text-sm"
              >
                Delete Selected ({selectedGroups.length})
              </button>
              <button
                onClick={() => handleBulkStatusChange('active')}
                className="bg-green-600 text-white px-3 py-2 rounded text-sm"
              >
                Set Active
              </button>
              <button
                onClick={() => handleBulkStatusChange('inactive')}
                className="bg-red-600 text-white px-3 py-2 rounded text-sm"
              >
                Set Inactive
              </button>
              <button
                onClick={() => handleBulkStatusChange('suspended')}
                className="bg-yellow-500 text-white px-3 py-2 rounded text-sm"
              >
                Suspend
              </button>
            </>
          )}
        </div>

        {groups.length === 0 ? (
          <p className="text-gray-500 pt-4">No groups match your criteria.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="col-span-full flex items-center gap-2">
              <button onClick={() => selectAllOnPage(pageGroupIds)} className="text-sm text-blue-600 flex items-center gap-1">
                {pageGroupIds.every((id) => selectedGroups.includes(id)) ? <FaCheckSquare /> : <FaRegSquare />} Select All on Page
              </button>
            </div>
            {paginatedGroups.map((group, idx) => {
              const placeholder = imagePool[(idx + (currentPage - 1) * itemsPerPage) % imagePool.length];
              return (
              <div
                key={group.id}
                className={`p-4 bg-white rounded-lg shadow hover:shadow-lg border space-y-2 relative ${selectedGroups.includes(group.id) ? 'ring-2 ring-yellow-400' : ''}`}
              >
                <button
                  onClick={() => toggleSelect(group.id)}
                  className="absolute top-2 left-2 text-yellow-600"
                  title="Select"
                >
                  {selectedGroups.includes(group.id) ? <FaCheckSquare /> : <FaRegSquare />}
                </button>

                <img
                  src={group.cover_image || placeholder}
                  alt={group.name}
                  className="w-full h-32 object-cover rounded-md mb-2"
                />

                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-800">{group.name}</h2>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${
                      group.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : group.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : group.status === 'inactive'
                        ? 'bg-gray-100 text-gray-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {group.status}
                  </span>
                </div>
                <p className="text-xs bg-gray-800 text-white inline-block px-2 py-0.5 rounded">
                  📁 {group.category || 'N/A'}
                </p>

                <p className="text-sm text-gray-600">👤 {group.creator || group.creator_name || 'N/A'}</p>
                <p className="text-sm text-gray-600">👥 {group.membersCount} members</p>
                <p className="text-xs text-gray-400">
                  📅 Created: {new Date(group.createdAt).toLocaleDateString()}
                </p>
                <p className="text-xs">
                  🔓 Visibility: <span className="font-semibold">{group.isPublic ? 'Public' : 'Private'}</span>
                </p>

                <div className="flex flex-wrap gap-2 mt-3">
                  <Link href={`/dashboard/admin/groups/${group.id}`}>
                    <button className="bg-blue-600 text-white px-3 py-1 rounded flex items-center gap-1 text-sm">
                      <FaEye /> View
                    </button>
                  </Link>

                  {group.status === 'pending' && (
                    <button
                      onClick={() => toggleStatus(group.id, 'active')}
                      className="bg-green-600 text-white px-3 py-1 rounded flex items-center gap-1 text-sm"
                    >
                      <FaToggleOn /> Approve
                    </button>
                  )}

                  {group.status === 'active' && (
                    <>
                      <button
                        onClick={() => toggleStatus(group.id, 'inactive')}
                        className="bg-red-600 text-white px-3 py-1 rounded flex items-center gap-1 text-sm"
                      >
                        <FaToggleOff /> Deactivate
                      </button>
                      <button
                        onClick={() => toggleStatus(group.id, 'suspended')}
                        className="bg-yellow-500 text-white px-3 py-1 rounded flex items-center gap-1 text-sm"
                      >
                        <FaToggleOff /> Suspend
                      </button>
                    </>
                  )}

                  {group.status === 'inactive' && (
                    <button
                      onClick={() => toggleStatus(group.id, 'active')}
                      className="bg-green-600 text-white px-3 py-1 rounded flex items-center gap-1 text-sm"
                    >
                      <FaToggleOn /> Activate
                    </button>
                  )}

                  {group.status === 'suspended' && (
                    <button
                      onClick={() => toggleStatus(group.id, 'active')}
                      className="bg-green-600 text-white px-3 py-1 rounded flex items-center gap-1 text-sm"
                    >
                      <FaToggleOn /> Activate
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(group.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded flex items-center gap-1 text-sm"
                  >
                    <FaTrashAlt /> Delete
                  </button>
                </div>
              </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 rounded border text-sm font-medium ${
                  currentPage === i + 1
                    ? 'bg-yellow-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        onClose={closeConfirmModal}
        onConfirm={confirmModal.onConfirm}
      />
    </AdminLayout>
  );
}
