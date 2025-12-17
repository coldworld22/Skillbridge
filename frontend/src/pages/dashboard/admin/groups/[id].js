// Enhanced Admin Group Details Page (Final Polished UI with All Tabs and Overview Enhancements)
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';
import AbortController from 'abort-controller';
import AdminLayout from '@/components/layouts/AdminLayout';
import ConfirmModal from '@/components/common/ConfirmModal';
import GroupChat from '@/components/chat/GroupChat';
import withAuthProtection from '@/hooks/withAuthProtection';
import usePermission from '@/hooks/usePermission';
import {
  FaUsers,
  FaCalendarAlt,
  FaLock,
  FaUserShield,
  FaTrash,
  FaUserTag,
  FaDownload,
  FaCheckSquare,
  FaRegSquare,
  FaFolderOpen,
} from 'react-icons/fa';
import groupService from '@/services/groupService';
import toast from 'react-hot-toast';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../../../next-i18next.config.js';

// ...imports (same as before)...

// Continue from your existing AdminGroupDetailsPage component

function AdminGroupDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const { t } = useTranslation('adminGroupDetails');
  const { can, requirePermission } = usePermission();
  const canManage = can("manage_groups");
  const permissionWarning = t('adminGroupDetailsPage.toasts.permissionDenied', {
    defaultValue: 'You do not have permission to manage groups.',
  });
  const [group, setGroup] = useState();
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [members, setMembers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
  });

  const openConfirmModal = ({ title, message, onConfirm }) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm });
  };

  const closeConfirmModal = () => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    if (!router.isReady || !id) return;
    const controller = new AbortController();
    let isMounted = true;

    const load = async () => {
      try {
        const [data, list, reqs] = await Promise.all([
          groupService.getGroupById(id, { signal: controller.signal }),
          groupService
            .getGroupMembers(id, { signal: controller.signal })
            .catch(() => []),
          groupService
            .getJoinRequestsForGroup(id, { signal: controller.signal })
            .catch(() => []),
        ]);
        if (!isMounted) return;
        if (!data) {
          setNotFound(true);
          return;
        }
        setGroup(data);
        setMembers(list);
        setRequests(reqs);
        setPendingCount(Array.isArray(reqs) ? reqs.length : 0);
      } catch (err) {
        if (err.name === 'AbortError' || err.name === 'CanceledError') return;
        if (err?.response?.status === 404) {
          setNotFound(true);
        } else {
          toast.error(
            t('adminGroupDetailsPage.toasts.loadError', {
              defaultValue: 'Failed to load group',
            })
          );
        }
      }
    };
    load();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [router.isReady, id, t]);

  const filteredMembers = members.filter((m) =>
    m.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const sortedMembers = [...filteredMembers].sort((a, b) => {
    if (sortKey === 'name') return a.name.localeCompare(b.name);
    if (sortKey === 'role') return (a.role || '').localeCompare(b.role || '');
    return 0;
  });
  const paginatedMembers = sortedMembers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(sortedMembers.length / itemsPerPage);

  const toggleMemberSelect = (id) => {
    setSelectedMembers(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const selectAllMembersOnPage = () => {
    const ids = paginatedMembers.map(m => m.id);
    const allSelected = ids.every(id => selectedMembers.includes(id));
    setSelectedMembers(allSelected ? selectedMembers.filter(id => !ids.includes(id)) : [...new Set([...selectedMembers, ...ids])]);
  };

  const bulkRemove = () => {
    if (!requirePermission("manage_groups", permissionWarning)) {
      return;
    }
    if (!group) return;
    openConfirmModal({
      title: t('adminGroupDetailsPage.modals.bulkRemove.title', {
        defaultValue: 'Confirm Removal',
      }),
      message: t('adminGroupDetailsPage.modals.bulkRemove.message', {
        defaultValue: 'Are you sure you want to remove the selected members?',
      }),
      onConfirm: async () => {
        try {
          await Promise.all(
            selectedMembers.map((mid) =>
              groupService.manageMember(group.id, mid, 'kick')
            )
          );
          setMembers((prev) => prev.filter((m) => !selectedMembers.includes(m.id)));
          setSelectedMembers([]);
          toast.success(
            t('adminGroupDetailsPage.toasts.bulkRemoveSuccess', {
              defaultValue: 'Selected members removed',
            })
          );
        } catch (error) {
          console.error('Bulk removal failed:', error);
          toast.error(
            t('adminGroupDetailsPage.toasts.bulkRemoveError', {
              defaultValue: 'Some members could not be removed.',
            })
          );
        }
      },
    });
  };

  const handleRemove = (mid) => {
    if (!requirePermission("manage_groups", permissionWarning)) {
      return;
    }
    if (!group) return;
    openConfirmModal({
      title: t('adminGroupDetailsPage.modals.removeMember.title', {
        defaultValue: 'Confirm Removal',
      }),
      message: t('adminGroupDetailsPage.modals.removeMember.message', {
        defaultValue: 'Remove this member?',
      }),
      onConfirm: async () => {
        try {
          await groupService.manageMember(group.id, mid, 'kick');
          setMembers((prev) => prev.filter((m) => m.id !== mid));
          setSelectedMembers((prev) => prev.filter((id) => id !== mid));
          toast.success(
            t('adminGroupDetailsPage.toasts.memberRemoved', {
              defaultValue: 'Member removed',
            })
          );
        } catch (err) {
          toast.error(
            t('adminGroupDetailsPage.toasts.memberRemoveError', {
              defaultValue: 'Failed to remove member',
            })
          );
        }
      },
    });
  };

  const handlePromote = (mid) => {
    if (!requirePermission("manage_groups", permissionWarning)) {
      return;
    }
    if (!group) return;
    openConfirmModal({
      title: t('adminGroupDetailsPage.modals.promoteMember.title', {
        defaultValue: 'Confirm Promotion',
      }),
      message: t('adminGroupDetailsPage.modals.promoteMember.message', {
        defaultValue: 'Promote this member to Admin?',
      }),
      onConfirm: async () => {
        try {
          await groupService.manageMember(group.id, mid, 'promote');
          setMembers((prev) =>
            prev.map((m) =>
              m.id === mid && m.role === 'member' ? { ...m, role: 'admin' } : m
            )
          );
          toast.success(
            t('adminGroupDetailsPage.toasts.memberPromoted', {
              defaultValue: 'Member promoted to admin',
            })
          );
        } catch (err) {
          toast.error(
            t('adminGroupDetailsPage.toasts.memberPromoteError', {
              defaultValue: 'Failed to promote member',
            })
          );
        }
      },
    });
  };

  const handleApproveRequest = (req) => {
    if (!requirePermission("manage_groups", permissionWarning)) {
      return;
    }
    openConfirmModal({
      title: t('adminGroupDetailsPage.modals.approveRequest.title', {
        defaultValue: 'Approve Request',
      }),
      message: t('adminGroupDetailsPage.modals.approveRequest.message', {
        name: req.name,
        defaultValue: 'Approve {{name}}?',
      }),
      onConfirm: async () => {
        try {
          const payload = await groupService.approveRequest(req.id);
          const memberRow = payload?.member;
          setMembers((prev) => [
            ...prev,
            {
              id: memberRow?.user_id || req.userId,
              name: req.name,
              role: memberRow?.role || 'member',
              disabled: memberRow?.disabled ?? false,
            },
          ]);
          setRequests((prev) => {
            const next = prev.filter((r) => r.id !== req.id);
            setPendingCount(next.length);
            return next;
          });
          toast.success(
            t('adminGroupDetailsPage.toasts.requestApproved', {
              defaultValue: 'Request approved',
            })
          );
        } catch (err) {
          console.error('Failed to approve request', err);
          toast.error(
            t('adminGroupDetailsPage.toasts.requestApproveError', {
              defaultValue: 'Failed to approve request',
            })
          );
        }
      },
    });
  };

  const handleRejectRequest = (req) => {
    if (!requirePermission("manage_groups", permissionWarning)) {
      return;
    }
    openConfirmModal({
      title: t('adminGroupDetailsPage.modals.rejectRequest.title', {
        defaultValue: 'Reject Request',
      }),
      message: t('adminGroupDetailsPage.modals.rejectRequest.message', {
        name: req.name,
        defaultValue: 'Reject {{name}}?',
      }),
      onConfirm: async () => {
        try {
          await groupService.rejectRequest(req.id);
          setRequests((prev) => {
            const next = prev.filter((r) => r.id !== req.id);
            setPendingCount(next.length);
            return next;
          });
          toast.success(
            t('adminGroupDetailsPage.toasts.requestRejected', {
              defaultValue: 'Request rejected',
            })
          );
        } catch (err) {
          console.error('Failed to reject request', err);
          toast.error(
            t('adminGroupDetailsPage.toasts.requestRejectError', {
              defaultValue: 'Failed to reject request',
            })
          );
        }
      },
    });
  };

  const exportMembersToCSV = () => {
    const header = [
      t('adminGroupDetailsPage.members.csvHeaders.name', {
        defaultValue: 'Name',
      }),
      t('adminGroupDetailsPage.members.csvHeaders.role', {
        defaultValue: 'Role',
      }),
    ];
    const rows = sortedMembers.map((m) => [m.name, m.role]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = t('adminGroupDetailsPage.members.csvFilename', {
      defaultValue: 'members.csv',
    });
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  if (notFound) {
    return (
      <AdminLayout>
        <div className="p-6">
          {t('adminGroupDetailsPage.states.notFound', {
            defaultValue: 'Group not found',
          })}
        </div>
      </AdminLayout>
    );
  }

  if (!group) {
    return (
      <AdminLayout>
        <div className="p-6">
          {t('adminGroupDetailsPage.states.loading', {
            defaultValue: 'Loading group...',
          })}
        </div>
      </AdminLayout>
    );
  }

  const tabs = ['overview', 'chat', 'members', 'requests'];
  const tabLabels = {
    overview: t('adminGroupDetailsPage.tabs.overview', { defaultValue: 'Overview' }),
    chat: t('adminGroupDetailsPage.tabs.chat', { defaultValue: 'Chat' }),
    members: t('adminGroupDetailsPage.tabs.members', { defaultValue: 'Members' }),
    requests: t('adminGroupDetailsPage.tabs.requests', { defaultValue: 'Requests' }),
  };
  const pendingBannerText = t('adminGroupDetailsPage.pendingBanner', {
    count: pendingCount,
    defaultValue: '{{count}} pending join request',
  });
  const backToGroupsLabel = t('adminGroupDetailsPage.actions.back', {
    defaultValue: '← Back to Groups',
  });
  const pageTitle = t('adminGroupDetailsPage.title', {
    name: group.name,
    defaultValue: '🔍 Group Overview: {{name}}',
  });
  const missingValueLabel = t('adminGroupDetailsPage.overview.missing', {
    defaultValue: 'N/A',
  });
  const visibilityValue = group.isPublic
    ? t('adminGroupDetailsPage.overview.visibilityPublic', { defaultValue: 'Public' })
    : t('adminGroupDetailsPage.overview.visibilityPrivate', { defaultValue: 'Private' });
  const statusLabel = group.status
    ? t(`adminGroupDetailsPage.overview.statusLabels.${group.status}`, { defaultValue: group.status })
    : null;

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <button onClick={() => router.back()} className="text-sm text-blue-600 hover:underline mb-2">
          {backToGroupsLabel}
        </button>

        <h1 className="text-3xl font-bold text-gray-800">{pageTitle}</h1>
        {pendingCount > 0 && (
          <div className="bg-red-100 text-red-800 px-4 py-2 rounded mb-2">
            {pendingBannerText}
          </div>
        )}

        <div className="flex gap-2 border-b pb-3">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-sm px-4 py-2 transition rounded-t font-medium ${activeTab === tab
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'text-gray-600 hover:text-yellow-600'
                }`}
            >
              {tab === 'requests' ? (
                <>
                  {tabLabels[tab]}
                  {pendingCount > 0 && (
                    <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-red-600 text-white">
                      {pendingCount}
                    </span>
                  )}
                </>
              ) : (
                tabLabels[tab]
              )}
            </button>
          ))}
        </div>

        {/* === Overview Tab === */}
        {activeTab === 'overview' && (
          <div className="bg-white p-6 rounded-lg shadow space-y-4">
            <div className="flex flex-col md:flex-row gap-6">
              <img
                src={group.cover_image || group.image || '/images/placeholder.png'}
                alt={group.name}
                className="w-full max-w-xs h-48 object-cover rounded-lg border"
              />
              <div className="flex-1 space-y-3">
                <h2 className="text-xl font-bold text-gray-800">{group.name}</h2>
                <p className="text-gray-700 text-sm leading-relaxed">{group.description}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
                  <p>
                    <FaUserShield className="inline mr-1" />{' '}
                    {t('adminGroupDetailsPage.overview.creator', {
                      defaultValue: 'Creator:',
                    })}{' '}
                    <strong>{group.creator || group.creator_name || missingValueLabel}</strong>
                  </p>
                  <p>
                    <FaCalendarAlt className="inline mr-1" />{' '}
                    {t('adminGroupDetailsPage.overview.created', {
                      defaultValue: 'Created:',
                    })}{' '}
                    {group.createdAt ? new Date(group.createdAt).toLocaleDateString() : missingValueLabel}
                  </p>
                  <p>
                    <FaUsers className="inline mr-1" />{' '}
                    {t('adminGroupDetailsPage.overview.members', {
                      defaultValue: 'Members:',
                    })}{' '}
                    {group.membersCount ?? members.length}
                  </p>
                  <p>
                    <FaLock className="inline mr-1" />{' '}
                    {t('adminGroupDetailsPage.overview.visibility', {
                      defaultValue: 'Visibility:',
                    })}{' '}
                    {visibilityValue}
                  </p>
                  {group.category && (
                    <p>
                      <FaFolderOpen className="inline mr-1" />{' '}
                      {t('adminGroupDetailsPage.overview.category', {
                        defaultValue: 'Category:',
                      })}{' '}
                      {group.category}
                    </p>
                  )}
                  {group.status && (
                    <p>
                      {t('adminGroupDetailsPage.overview.status', {
                        defaultValue: 'Status:',
                      })}{' '}
                      <span
                        className={`font-semibold ${
                          group.status === 'active'
                            ? 'text-green-600'
                            : group.status === 'pending'
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}
                      >
                        {statusLabel}
                      </span>
                    </p>
                  )}
                  {group.offerSummary && (
                    <>
                      <p>
                        {t('adminGroupDetailsPage.overview.offers', {
                          defaultValue: 'Offers:',
                        })}{' '}
                        {group.offerSummary.count}
                      </p>
                      <p>
                        {t('adminGroupDetailsPage.overview.feesCollected', {
                          defaultValue: 'Fees Collected:',
                        })}{' '}
                        $
                        {Number(group.offerSummary.total_fee || 0).toFixed(2)}
                      </p>
                    </>
                  )}
                </div>
                <div className="pt-3 border-t">
                  <p className="text-sm text-gray-600">
                    <strong>
                      {t('adminGroupDetailsPage.overview.purpose', {
                        defaultValue: 'Purpose:',
                      })}
                    </strong>{' '}
                    {group.purpose || missingValueLabel}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    <strong>
                      {t('adminGroupDetailsPage.overview.toolsUsed', {
                        defaultValue: 'Tools Used:',
                      })}
                    </strong>{' '}
                    {(() => {
                      const tools = Array.isArray(group.tools)
                        ? group.tools
                        : Array.isArray(group.tags)
                        ? group.tags
                        : [];
                      return tools.length > 0 ? tools.join(', ') : missingValueLabel;
                    })()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === Chat Tab === */}
        {activeTab === 'chat' && group && (
          <GroupChat groupId={group.id} groupName={group.name} />
        )}

        {/* === Members Tab === */}
        {activeTab === 'members' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex gap-2 items-center w-full sm:w-auto">
                <label className="text-sm font-medium text-gray-600">
                  {t('adminGroupDetailsPage.members.sort.label', {
                    defaultValue: 'Sort by:',
                  })}
                </label>
                <select className="border text-sm px-2 py-1 rounded" value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
                  <option value="name">
                    {t('adminGroupDetailsPage.members.sort.name', {
                      defaultValue: 'Name',
                    })}
                  </option>
                  <option value="role">
                    {t('adminGroupDetailsPage.members.sort.role', {
                      defaultValue: 'Role',
                    })}
                  </option>
                </select>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder={t('adminGroupDetailsPage.members.searchPlaceholder', {
                    defaultValue: 'Search members...',
                  })}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border px-3 py-1 rounded w-full sm:w-64 text-sm"
                />
                <button
                  onClick={exportMembersToCSV}
                  className="bg-gray-100 hover:bg-gray-200 text-sm px-3 py-1 rounded flex items-center gap-1"
                >
                  <FaDownload />{' '}
                  {t('adminGroupDetailsPage.members.export', {
                    defaultValue: 'Export',
                  })}
                </button>
                {selectedMembers.length > 0 && (
                  <button
                    onClick={bulkRemove}
                    className="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1 rounded disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={!canManage}
                  >
                    {t('adminGroupDetailsPage.members.removeSelected', {
                      count: selectedMembers.length,
                      defaultValue: 'Remove Selected ({{count}})',
                    })}
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto shadow rounded border">
              <table className="min-w-full text-sm bg-white">
                <thead className="bg-gray-100 text-left text-gray-700">
                  <tr>
                    <th className="p-2 w-10">
                      <button onClick={selectAllMembersOnPage}>
                    {paginatedMembers.every((m) => selectedMembers.includes(m.id)) ? <FaCheckSquare /> : <FaRegSquare />}
                  </button>
                </th>
                <th className="p-2">
                  {t('adminGroupDetailsPage.members.table.columns.name', {
                    defaultValue: 'Name',
                  })}
                </th>
                <th className="p-2">
                  {t('adminGroupDetailsPage.members.table.columns.role', {
                    defaultValue: 'Role',
                  })}
                </th>
                <th className="p-2 text-center">
                  {t('adminGroupDetailsPage.members.table.columns.actions', {
                    defaultValue: 'Actions',
                  })}
                </th>
              </tr>
            </thead>
                <tbody>
              {paginatedMembers.map((member) => {
                const translatedRole = t(`adminGroupDetailsPage.members.roles.${member.role}`, {
                  defaultValue: member.role,
                });
                return (
                  <tr key={member.id} className="border-t hover:bg-gray-50">
                    <td className="p-2">
                      <button onClick={() => toggleMemberSelect(member.id)}>
                        {selectedMembers.includes(member.id) ? <FaCheckSquare /> : <FaRegSquare />}
                      </button>
                    </td>
                    <td className="p-2">{member.name}</td>
                    <td className="p-2 font-medium">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                          member.role === 'admin'
                            ? 'bg-blue-100 text-blue-700'
                            : member.role === 'member'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-purple-100 text-purple-700'
                        }`}
                      >
                        {translatedRole}
                      </span>
                    </td>
                    <td className="p-2 flex justify-center gap-2 text-sm">
                      <button
                        onClick={() => handleRemove(member.id)}
                        className="bg-red-500 text-white px-2 py-1 rounded flex items-center gap-1 disabled:opacity-60 disabled:cursor-not-allowed"
                        disabled={!canManage}
                      >
                        <FaTrash />{' '}
                        {t('adminGroupDetailsPage.members.actions.remove', {
                          defaultValue: 'Remove',
                        })}
                      </button>
                      {member.role === 'member' && (
                        <button
                          onClick={() => handlePromote(member.id)}
                          className="bg-yellow-500 text-white px-2 py-1 rounded flex items-center gap-1 disabled:opacity-60 disabled:cursor-not-allowed"
                          disabled={!canManage}
                        >
                          <FaUserTag />{' '}
                          {t('adminGroupDetailsPage.members.actions.promote', {
                            defaultValue: 'Promote',
                          })}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-1 pt-4">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-3 py-1 text-sm rounded border ${currentPage === i + 1 ? 'bg-yellow-500 text-white' : 'bg-white hover:bg-yellow-100 text-gray-700'
                      }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* === Requests Tab === */}
        {activeTab === 'requests' && (
          <div className="space-y-4 bg-white p-4 rounded shadow">
            {requests.length === 0 ? (
              <p className="text-gray-500 text-sm">
                {t('adminGroupDetailsPage.requests.empty', {
                  defaultValue: 'No pending requests.',
                })}
              </p>
            ) : (
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100 text-left">
                  <tr>
                    <th className="p-2">
                      {t('adminGroupDetailsPage.requests.table.columns.name', {
                        defaultValue: 'Name',
                      })}
                    </th>
                    <th className="p-2">
                      {t('adminGroupDetailsPage.requests.table.columns.email', {
                        defaultValue: 'Email',
                      })}
                    </th>
                    <th className="p-2">
                      {t('adminGroupDetailsPage.requests.table.columns.requestedAt', {
                        defaultValue: 'Requested At',
                      })}
                    </th>
                    <th className="p-2 text-center">
                      {t('adminGroupDetailsPage.requests.table.columns.actions', {
                        defaultValue: 'Actions',
                      })}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr key={req.id} className="border-t hover:bg-gray-50">
                      <td className="p-2">{req.name}</td>
                      <td className="p-2">{req.email}</td>
                      <td className="p-2">{new Date(req.requestedAt).toLocaleDateString()}</td>
                      <td className="p-2 text-center flex justify-center gap-2">
                        <button
                          className="bg-green-600 text-white px-2 py-1 rounded disabled:opacity-60 disabled:cursor-not-allowed"
                          onClick={() => handleApproveRequest(req)}
                          disabled={!canManage}
                        >
                          {t('adminGroupDetailsPage.requests.actions.approve', {
                            defaultValue: '✅ Approve',
                          })}
                        </button>
                        <button
                          className="bg-red-500 text-white px-2 py-1 rounded disabled:opacity-60 disabled:cursor-not-allowed"
                          onClick={() => handleRejectRequest(req)}
                          disabled={!canManage}
                        >
                          {t('adminGroupDetailsPage.requests.actions.reject', {
                            defaultValue: '❌ Reject',
                          })}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onClose={closeConfirmModal}
        onConfirm={confirmModal.onConfirm}
      />
    </AdminLayout>
  );
}

const ProtectedAdminGroupDetailsPage = withAuthProtection(AdminGroupDetailsPage, {
  permissions: ["view_groups"],
});

export default ProtectedAdminGroupDetailsPage;

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['adminGroupDetails', 'common'], nextI18NextConfig)),
    },
  };
}
