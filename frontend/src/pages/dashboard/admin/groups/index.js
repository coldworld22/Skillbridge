import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../../../next-i18next.config.js';
import useDebounce from '@/hooks/useDebounce';
import AdminLayout from '@/components/layouts/AdminLayout';
import Link from 'next/link';
import withAuthProtection from '@/hooks/withAuthProtection';
import usePermission from '@/hooks/usePermission';
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

const itemsPerPage = 6;

function AdminGroupsIndex() {
  const { t, i18n } = useTranslation('dashboard');
  const { can, requirePermission } = usePermission();
  const canManage = can("manage_groups");
  const manageWarning = t('adminGroupsPage.alerts.no_permission', {
    defaultValue: 'You do not have permission to manage groups.',
  });
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

  const statusLabels = useMemo(
    () => ({
      pending: t('adminGroupsPage.statuses.pending', { defaultValue: 'Pending' }),
      active: t('adminGroupsPage.statuses.active', { defaultValue: 'Active' }),
      inactive: t('adminGroupsPage.statuses.inactive', { defaultValue: 'Inactive' }),
      suspended: t('adminGroupsPage.statuses.suspended', { defaultValue: 'Suspended' }),
    }),
    [t]
  );

  const filterOptions = useMemo(
    () => [
      { value: 'all', label: t('adminGroupsPage.filters.status_all', { defaultValue: 'All Statuses' }) },
      { value: 'pending', label: t('adminGroupsPage.filters.status_pending', { defaultValue: '🕓 Pending' }) },
      { value: 'active', label: t('adminGroupsPage.filters.status_active', { defaultValue: '✅ Active' }) },
      { value: 'inactive', label: t('adminGroupsPage.filters.status_inactive', { defaultValue: '⏸ Inactive' }) },
      { value: 'suspended', label: t('adminGroupsPage.filters.status_suspended', { defaultValue: '🚫 Suspended' }) },
    ],
    [t]
  );

  const sortOptionsConfig = useMemo(
    () => [
      { value: 'newest', label: t('adminGroupsPage.sort.newest', { defaultValue: '📅 Newest' }) },
      { value: 'oldest', label: t('adminGroupsPage.sort.oldest', { defaultValue: '📆 Oldest' }) },
      { value: 'members', label: t('adminGroupsPage.sort.members', { defaultValue: '👥 Most Members' }) },
    ],
    [t]
  );

  const csvHeaders = useMemo(
    () => [
      t('adminGroupsPage.csv_headers.id', { defaultValue: 'ID' }),
      t('adminGroupsPage.csv_headers.name', { defaultValue: 'Name' }),
      t('adminGroupsPage.csv_headers.status', { defaultValue: 'Status' }),
      t('adminGroupsPage.csv_headers.members', { defaultValue: 'Members' }),
      t('adminGroupsPage.csv_headers.visibility', { defaultValue: 'Visibility' }),
      t('adminGroupsPage.csv_headers.created_at', { defaultValue: 'Created At' }),
    ],
    [t]
  );

  const getStatusLabel = (status) => statusLabels[status] || status;
  const getVisibilityLabel = (isPublic) =>
    isPublic
      ? t('adminGroupsPage.group_card.public', { defaultValue: 'Public' })
      : t('adminGroupsPage.group_card.private', { defaultValue: 'Private' });

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
      .getAllGroups(debouncedSearch, statusFilter)
      .then((data) => setGroups(sortGroups(data)))
      .catch(() => setGroups([]));
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    setGroups((prev) => sortGroups(prev));
  }, [sortOption]);

  const toggleStatus = async (id, newStatus) => {
    if (!requirePermission("manage_groups", manageWarning)) {
      return;
    }
    try {
      await groupService.updateGroup(id, { status: newStatus });
      setGroups((prev) =>
        prev.map((g) => (g.id === id ? { ...g, status: newStatus } : g))
      );
      toast.success(
        t('adminGroupsPage.alerts.status_update_success', {
          status: getStatusLabel(newStatus),
        })
      );
    } catch {
      toast.error(t('adminGroupsPage.alerts.status_update_error', { defaultValue: 'Failed to update status' }));
    }
  };

  const handleDelete = (id) => {
    if (!requirePermission("manage_groups", manageWarning)) {
      return;
    }
    openConfirmModal({
      title: t('adminGroupsPage.confirm.delete_title', { defaultValue: 'Delete Group' }),
      message: t('adminGroupsPage.confirm.delete_message', { defaultValue: 'Are you sure you want to delete this group?' }),
      confirmText: t('adminGroupsPage.confirm.delete', { defaultValue: 'Delete' }),
      cancelText: t('cancel', { defaultValue: 'Cancel' }),
      onConfirm: async () => {
        try {
          await groupService.deleteGroup(id);
          toast.success(t('adminGroupsPage.alerts.delete_success', { defaultValue: 'Group deleted' }));
          setGroups((prev) => prev.filter((g) => g.id !== id));
          setSelectedGroups((prev) => prev.filter((gid) => gid !== id));
        } catch {
          toast.error(t('adminGroupsPage.alerts.delete_error', { defaultValue: 'Failed to delete group' }));
        }
      },
    });
  };

  const handleBulkDelete = () => {
    if (!requirePermission("manage_groups", manageWarning)) {
      return;
    }
    if (selectedGroups.length === 0) return;
    openConfirmModal({
      title: t('adminGroupsPage.confirm.delete_selected_title', { defaultValue: 'Delete Selected Groups' }),
      message: t('adminGroupsPage.confirm.delete_selected_message', { defaultValue: 'Delete selected groups?' }),
      confirmText: t('adminGroupsPage.confirm.delete', { defaultValue: 'Delete' }),
      cancelText: t('cancel', { defaultValue: 'Cancel' }),
      onConfirm: async () => {
        const results = await Promise.allSettled(
          selectedGroups.map((gid) => groupService.deleteGroup(gid).then(() => gid))
        );
        const succeededIds = results
          .filter((r) => r.status === 'fulfilled')
          .map((r) => r.value);
        const failed = results.length - succeededIds.length;
        if (failed) {
          toast.error(
            t('adminGroupsPage.alerts.bulk_delete_error', {
              count: failed,
              defaultValue: 'Failed to delete {{count}} groups',
            })
          );
        }
        if (succeededIds.length) {
          setGroups((prev) => prev.filter((g) => !succeededIds.includes(g.id)));
          toast.success(t('adminGroupsPage.alerts.bulk_delete_success', { defaultValue: 'Selected groups deleted' }));
        }
        setSelectedGroups([]);
      },
    });
  };

  const handleBulkStatusChange = (status) => {
    if (!requirePermission("manage_groups", manageWarning)) {
      return;
    }
    if (selectedGroups.length === 0) return;
    openConfirmModal({
      title: t('adminGroupsPage.confirm.change_status_title', { defaultValue: 'Change Status' }),
      message: t('adminGroupsPage.confirm.change_status_message', {
        status: getStatusLabel(status),
        defaultValue: 'Change status of selected groups to {{status}}?',
      }),
      confirmText: t('adminGroupsPage.confirm.confirm', { defaultValue: 'Confirm' }),
      cancelText: t('cancel', { defaultValue: 'Cancel' }),
      onConfirm: async () => {
        const results = await Promise.allSettled(
          selectedGroups.map((gid) =>
            groupService.updateGroup(gid, { status }).then(() => gid)
          )
        );
        const succeededIds = results
          .filter((r) => r.status === 'fulfilled')
          .map((r) => r.value);
        const failed = results.length - succeededIds.length;
        if (failed) {
          toast.error(
            t('adminGroupsPage.alerts.bulk_status_error', {
              count: failed,
              defaultValue: 'Failed to update {{count}} groups',
            })
          );
        }
        if (succeededIds.length) {
          setGroups((prev) =>
            prev.map((g) =>
              succeededIds.includes(g.id) ? { ...g, status } : g
            )
          );
          toast.success(
            t('adminGroupsPage.alerts.bulk_status_success', {
              status: getStatusLabel(status),
              defaultValue: 'Status updated to {{status}} for selected groups',
            })
          );
        }
        setSelectedGroups([]);
      },
    });
  };

  const exportToCSV = () => {
    const header = csvHeaders;
    const rows = groups.map((g) => [
      g.id,
      g.name,
      getStatusLabel(g.status ?? 'active'),
      g.membersCount,
      getVisibilityLabel(g.isPublic),
      g.createdAt,
    ]);
    const csvContent = [header, ...rows].map((row) => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = t('adminGroupsPage.csv_filename', { defaultValue: 'groups.csv' });
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
      allSelected
        ? prev.filter((id) => !groupIds.includes(id))
        : [...new Set([...prev, ...groupIds])]
    );
  };

  const totalPages = Math.ceil(groups.length / itemsPerPage);
  const paginatedGroups = groups.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const pageGroupIds = paginatedGroups.map((g) => g.id);
  const missingValueLabel = t('adminGroupsPage.group_card.missing_value', { defaultValue: 'N/A' });

  return (
    <AdminLayout>
      <div className="p-6 space-y-6" dir={i18n.dir()}>
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <h1 className="text-2xl font-bold">
            {t('adminGroupsPage.title', { defaultValue: '📋 Group Management' })}
          </h1>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={t('adminGroupsPage.search_placeholder', { defaultValue: 'Search by name or creator...' })}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="p-2 border rounded-md w-full md:w-64"
            />
            <button
              onClick={exportToCSV}
              className="flex items-center gap-1 px-3 py-2 bg-gray-200 rounded text-sm hover:bg-gray-300"
            >
              <FaDownload /> {t('adminGroupsPage.export_csv', { defaultValue: 'Export CSV' })}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="p-2 border rounded-md"
          >
            {filterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="p-2 border rounded-md"
          >
            {sortOptionsConfig.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <Link href="/dashboard/admin/groups/create">
            <button
              className="ml-auto border px-4 py-2 rounded text-sm bg-yellow-400 text-white hover:bg-yellow-500 disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={(event) => {
                if (!requirePermission("manage_groups", manageWarning)) {
                  event.preventDefault();
                  event.stopPropagation();
                }
              }}
              disabled={!canManage}
            >
              {t('adminGroupsPage.actions.create_group', { defaultValue: '+ Create Group' })}
            </button>
          </Link>

          {selectedGroups.length > 0 && (
            <>
              <button
                onClick={handleBulkDelete}
                className="bg-red-500 text-white px-3 py-2 rounded text-sm"
              >
                {t('adminGroupsPage.actions.delete_selected', {
                  count: selectedGroups.length,
                  defaultValue: 'Delete Selected ({{count}})',
                })}
              </button>
              <button
                onClick={() => handleBulkStatusChange('active')}
                className="bg-green-600 text-white px-3 py-2 rounded text-sm"
              >
                {t('adminGroupsPage.actions.bulk_set_active', { defaultValue: 'Set Active' })}
              </button>
              <button
                onClick={() => handleBulkStatusChange('inactive')}
                className="bg-red-600 text-white px-3 py-2 rounded text-sm"
              >
                {t('adminGroupsPage.actions.bulk_set_inactive', { defaultValue: 'Set Inactive' })}
              </button>
              <button
                onClick={() => handleBulkStatusChange('suspended')}
                className="bg-yellow-500 text-white px-3 py-2 rounded text-sm"
              >
                {t('adminGroupsPage.actions.bulk_suspend', { defaultValue: 'Suspend' })}
              </button>
            </>
          )}
        </div>

        {groups.length === 0 ? (
          <p className="text-gray-500 pt-4">
            {t('adminGroupsPage.empty_state', { defaultValue: 'No groups match your criteria.' })}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="col-span-full flex items-center gap-2">
              <button
                onClick={() => selectAllOnPage(pageGroupIds)}
                className="text-sm text-blue-600 flex items-center gap-1"
              >
                {pageGroupIds.every((id) => selectedGroups.includes(id)) ? (
                  <FaCheckSquare />
                ) : (
                  <FaRegSquare />
                )}
                {t('adminGroupsPage.actions.select_all_on_page', { defaultValue: 'Select All on Page' })}
              </button>
            </div>
            {paginatedGroups.map((group, idx) => {
              const placeholder = imagePool[
                (idx + (currentPage - 1) * itemsPerPage) % imagePool.length
              ];
              const creatorName = group.creator || group.creator_name || missingValueLabel;
              const membersText = t('adminGroupsPage.group_card.members', {
                count: group.membersCount ?? 0,
                defaultValue: '{{count}} members',
              });
              const createdText = t('adminGroupsPage.group_card.created', {
                date: new Date(group.createdAt).toLocaleDateString(i18n.language),
                defaultValue: '📅 Created: {{date}}',
              });
              const visibilityText = t('adminGroupsPage.group_card.visibility', {
                visibility: getVisibilityLabel(group.isPublic),
                defaultValue: '🔓 Visibility: {{visibility}}',
              });

              return (
                <div
                  key={group.id}
                  className={`p-4 bg-white rounded-lg shadow hover:shadow-lg border space-y-2 relative ${
                    selectedGroups.includes(group.id) ? 'ring-2 ring-yellow-400' : ''
                  }`}
                >
                  <button
                    onClick={() => toggleSelect(group.id)}
                    className="absolute top-2 left-2 text-yellow-600"
                    title={t('adminGroupsPage.actions.select', { defaultValue: 'Select' })}
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
                      {getStatusLabel(group.status)}
                    </span>
                  </div>
                  <p className="text-xs bg-gray-800 text-white inline-block px-2 py-0.5 rounded">
                    📁 {group.category || missingValueLabel}
                  </p>

                  <p className="text-sm text-gray-600">
                    {t('adminGroupsPage.group_card.creator', {
                      name: creatorName,
                      defaultValue: '👤 {{name}}',
                    })}
                  </p>
                  <p className="text-sm text-gray-600">👥 {membersText}</p>
                  <p className="text-xs text-gray-400">{createdText}</p>
                  <p className="text-xs">{visibilityText}</p>

                  <div className="flex flex-wrap gap-2 mt-3">
                    <Link href={`/dashboard/admin/groups/${group.id}`}>
                      <button className="bg-blue-600 text-white px-3 py-1 rounded flex items-center gap-1 text-sm">
                        <FaEye /> {t('adminGroupsPage.actions.view', { defaultValue: 'View' })}
                      </button>
                    </Link>

                    {group.status === 'pending' && (
                      <button
                        onClick={() => toggleStatus(group.id, 'active')}
                        className="bg-green-600 text-white px-3 py-1 rounded flex items-center gap-1 text-sm"
                      >
                        <FaToggleOn /> {t('adminGroupsPage.actions.approve', { defaultValue: 'Approve' })}
                      </button>
                    )}

                    {group.status === 'active' && (
                      <>
                        <button
                          onClick={() => toggleStatus(group.id, 'inactive')}
                          className="bg-red-600 text-white px-3 py-1 rounded flex items-center gap-1 text-sm"
                        >
                          <FaToggleOff /> {t('adminGroupsPage.actions.deactivate', { defaultValue: 'Deactivate' })}
                        </button>
                        <button
                          onClick={() => toggleStatus(group.id, 'suspended')}
                          className="bg-yellow-500 text-white px-3 py-1 rounded flex items-center gap-1 text-sm"
                        >
                          <FaToggleOff /> {t('adminGroupsPage.actions.suspend', { defaultValue: 'Suspend' })}
                        </button>
                      </>
                    )}

                    {group.status === 'inactive' && (
                      <button
                        onClick={() => toggleStatus(group.id, 'active')}
                        className="bg-green-600 text-white px-3 py-1 rounded flex items-center gap-1 text-sm"
                      >
                        <FaToggleOn /> {t('adminGroupsPage.actions.activate', { defaultValue: 'Activate' })}
                      </button>
                    )}

                    {group.status === 'suspended' && (
                      <button
                        onClick={() => toggleStatus(group.id, 'active')}
                        className="bg-green-600 text-white px-3 py-1 rounded flex items-center gap-1 text-sm"
                      >
                        <FaToggleOn /> {t('adminGroupsPage.actions.activate', { defaultValue: 'Activate' })}
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(group.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded flex items-center gap-1 text-sm"
                    >
                      <FaTrashAlt /> {t('adminGroupsPage.actions.delete', { defaultValue: 'Delete' })}
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

const ProtectedAdminGroupsIndex = withAuthProtection(AdminGroupsIndex, {
  permissions: ["view_groups"],
});

export default ProtectedAdminGroupsIndex;

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['dashboard'], nextI18NextConfig)),
    },
  };
}
