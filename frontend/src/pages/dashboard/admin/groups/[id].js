// Enhanced Admin Group Details Page (Final Polished UI with All Tabs and Overview Enhancements)
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import {
  FaUsers,
  FaCalendarAlt,
  FaLock,
  FaUserShield,
  FaTrash,
  FaUserTag,
  FaUserPlus,
  FaTimes,
  FaDownload,
  FaCheckSquare,
  FaRegSquare,
  FaFolderOpen,
} from 'react-icons/fa';
import groupService from '@/services/groupService';

// Placeholder for pending join requests functionality
const mockRequests = [];

// ...imports (same as before)...

// Continue from your existing AdminGroupDetailsPage component

export default function AdminGroupDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const [group, setGroup] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [members, setMembers] = useState([]);
  const [requests, setRequests] = useState(mockRequests);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    if (!router.isReady || !id) return;
    const load = async () => {
      try {
        const data = await groupService.getGroupById(id);
        setGroup(data);
      } catch {
        setGroup(null);
      }
      try {
        const list = await groupService.getGroupMembers(id);
        setMembers(list);
      } catch {
        setMembers([]);
      }
    };
    load();
  }, [router.isReady, id]);

  const filteredMembers = members.filter((m) =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
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

  const bulkRemove = async () => {
    if (!group) return;
    if (confirm('Are you sure you want to remove the selected members?')) {
      for (const mid of selectedMembers) {
        try {
          await groupService.manageMember(group.id, mid, 'kick');
        } catch {
          // ignore errors per member
        }
      }
      setMembers(members.filter((m) => !selectedMembers.includes(m.id)));
      setSelectedMembers([]);
    }
  };

  const handleRemove = async (id) => {
    if (!group) return;
    if (confirm('Remove this member?')) {
      try {
        await groupService.manageMember(group.id, id, 'kick');
        setMembers(members.filter((m) => m.id !== id));
      } catch {
        // ignore
      }
    }
  };

  const handlePromote = async (id) => {
    if (!group) return;
    if (confirm('Promote this member to Moderator?')) {
      try {
        await groupService.manageMember(group.id, id, 'promote');
        setMembers(
          members.map((m) =>
            m.id === id && m.role === 'member' ? { ...m, role: 'admin' } : m
          )
        );
      } catch {
        // ignore
      }
    }
  };

  const exportMembersToCSV = () => {
    const header = ['Name', 'Role'];
    const rows = sortedMembers.map((m) => [m.name, m.role]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'members.csv';
    link.click();
  };

  if (!group) {
    return <AdminLayout><div className="p-6">Loading group...</div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <button onClick={() => router.back()} className="text-sm text-blue-600 hover:underline mb-2">
          ← Back to Groups
        </button>

        <h1 className="text-3xl font-bold text-gray-800">🔍 Group Overview: {group.name}</h1>

        <div className="flex gap-2 border-b pb-3">
          {['overview', 'members', 'requests'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-sm px-4 py-2 transition rounded-t font-medium ${activeTab === tab
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'text-gray-600 hover:text-yellow-600'
                }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
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
                    <FaUserShield className="inline mr-1" /> Creator:{' '}
                    <strong>{group.creator || group.creator_name || 'N/A'}</strong>
                  </p>
                  <p>
                    <FaCalendarAlt className="inline mr-1" /> Created:{' '}
                    {group.createdAt ? new Date(group.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                  <p>
                    <FaUsers className="inline mr-1" /> Members: {group.membersCount ?? members.length}
                  </p>
                  <p>
                    <FaLock className="inline mr-1" /> Visibility:{' '}
                    {group.isPublic ? 'Public' : 'Private'}
                  </p>
                  {group.category && (
                    <p>
                      <FaFolderOpen className="inline mr-1" /> Category: {group.category}
                    </p>
                  )}
                  {group.status && (
                    <p>
                      Status:{' '}
                      <span
                        className={`font-semibold ${
                          group.status === 'active'
                            ? 'text-green-600'
                            : group.status === 'pending'
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}
                      >
                        {group.status}
                      </span>
                    </p>
                  )}
                </div>
                <div className="pt-3 border-t">
                  <p className="text-sm text-gray-600"><strong>Purpose:</strong> {group.purpose}</p>
                  <p className="text-sm text-gray-600 mt-1"><strong>Tools Used:</strong> {group.tools.join(', ')}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === Members Tab === */}
        {activeTab === 'members' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex gap-2 items-center w-full sm:w-auto">
                <label className="text-sm font-medium text-gray-600">Sort by:</label>
                <select className="border text-sm px-2 py-1 rounded" value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
                  <option value="name">Name</option>
                  <option value="role">Role</option>
                </select>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border px-3 py-1 rounded w-full sm:w-64 text-sm"
                />
                <button
                  onClick={exportMembersToCSV}
                  className="bg-gray-100 hover:bg-gray-200 text-sm px-3 py-1 rounded flex items-center gap-1"
                >
                  <FaDownload /> Export
                </button>
                {selectedMembers.length > 0 && (
                  <button
                    onClick={bulkRemove}
                    className="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1 rounded"
                  >
                    Remove Selected ({selectedMembers.length})
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
                    <th className="p-2">Name</th>
                    <th className="p-2">Role</th>
                    <th className="p-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedMembers.map((member) => (
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
                          {member.role}
                        </span>
                      </td>
                      <td className="p-2 flex justify-center gap-2 text-sm">
                        <button
                          onClick={() => handleRemove(member.id)}
                          className="bg-red-500 text-white px-2 py-1 rounded flex items-center gap-1"
                        >
                          <FaTrash /> Remove
                        </button>
                        {member.role === 'member' && (
                          <button
                            onClick={() => handlePromote(member.id)}
                            className="bg-yellow-500 text-white px-2 py-1 rounded flex items-center gap-1"
                          >
                            <FaUserTag /> Promote
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
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
              <p className="text-gray-500 text-sm">No pending requests.</p>
            ) : (
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100 text-left">
                  <tr>
                    <th className="p-2">Name</th>
                    <th className="p-2">Email</th>
                    <th className="p-2">Requested At</th>
                    <th className="p-2 text-center">Actions</th>
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
                          className="bg-green-600 text-white px-2 py-1 rounded"
                          onClick={() => {
                            if (confirm(`Approve ${req.name}?`)) {
                              setMembers([
                                ...members,
                                { id: Date.now(), name: req.name, role: 'member' },
                              ]);
                              setRequests(requests.filter((r) => r.id !== req.id));
                            }
                          }}
                        >
                          ✅ Approve
                        </button>
                        <button
                          className="bg-red-500 text-white px-2 py-1 rounded"
                          onClick={() => {
                            if (confirm(`Reject ${req.name}?`)) {
                              setRequests(requests.filter((r) => r.id !== req.id));
                            }
                          }}
                        >
                          ❌ Reject
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
    </AdminLayout>
  );
}

