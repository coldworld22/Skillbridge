import { useEffect, useState } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import Link from 'next/link';
import {
  FaSearch,
  FaUsers,
  FaTrashAlt,
  FaEye,
  FaToggleOn,
  FaToggleOff,
  FaDownload,
  FaCheckSquare,
  FaRegSquare
} from 'react-icons/fa';

const imagePool = [
  'https://media.npr.org/assets/img/2012/01/25/newnewearth_wide-e15c88c202099fecf4a9d6f6f0e2a19826d9a26f.jpg?s=1400&c=100&f=jpeg',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRE-jRZ8r7TmUYfX4yqoiabzWXlqMiU4mZbxw&s',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTFsWQ2eTVL1xGadTXxeFlmMgNmWr31H7CmRg&s',
];

const mockGroups = [
  {
    id: 'g1',
    name: 'Frontend Wizards',
    creator: 'Sarah Johnson',
    status: 'pending',
    membersCount: 128,
    isPublic: true,
    createdAt: '2024-12-01',
    image: imagePool[0],
    category: 'Web Development',
  },
  {
    id: 'g2',
    name: 'AI Pioneers',
    creator: 'Ali Mansour',
    status: 'suspended',
    membersCount: 210,
    isPublic: false,
    createdAt: '2025-01-15',
    image: imagePool[1],
    category: 'Artificial Intelligence',
  },
  {
    id: 'g3',
    name: 'Design Guild',
    creator: 'Noura Faris',
    status: 'active',
    membersCount: 95,
    isPublic: true,
    createdAt: '2024-11-10',
    image: imagePool[2],
    category: 'UI/UX Design',
  },
  {
    id: 'g4',
    name: 'Backend Builders',
    creator: 'Omar Al-Qahtani',
    status: 'active',
    membersCount: 150,
    isPublic: false,
    createdAt: '2025-01-22',
    image: imagePool[0],
    category: 'Backend Development',
  },
  {
    id: 'g5',
    name: 'Crypto Coders',
    creator: 'Layla Mahmoud',
    status: 'suspended',
    membersCount: 180,
    isPublic: true,
    createdAt: '2024-10-05',
    image: imagePool[1],
    category: 'Blockchain',
  },
  {
    id: 'g6',
    name: 'Mobile Mavericks',
    creator: 'Khalid Zayed',
    status: 'active',
    membersCount: 76,
    isPublic: true,
    createdAt: '2025-02-01',
    image: imagePool[2],
    category: 'Mobile Development',
  },
  {
    id: 'g7',
    name: 'Cloud Commanders',
    creator: 'Yasmine Al-Khatib',
    status: 'pending',
    membersCount: 132,
    isPublic: false,
    createdAt: '2024-09-12',
    image: imagePool[0],
    category: 'Cloud Computing',
  },
  {
    id: 'g8',
    name: 'DevOps Den',
    creator: 'Hassan El-Sayed',
    status: 'active',
    membersCount: 144,
    isPublic: true,
    createdAt: '2024-08-28',
    image: imagePool[1],
    category: 'DevOps',
  },
  {
    id: 'g9',
    name: 'Cyber Ninjas',
    creator: 'Alya Dabbagh',
    status: 'suspended',
    membersCount: 99,
    isPublic: true,
    createdAt: '2025-01-05',
    image: imagePool[2],
    category: 'Cybersecurity',
  },
  {
    id: 'g10',
    name: 'AI Think Tank',
    creator: 'Fahad Al-Rasheed',
    status: 'pending',
    membersCount: 110,
    isPublic: false,
    createdAt: '2025-03-01',
    image: imagePool[0],
    category: 'Machine Learning',
  },
];


export default function AdminGroupsIndex() {
  const [groups, setGroups] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOption, setSortOption] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const itemsPerPage = 6;

  useEffect(() => {
    let filtered = [...mockGroups];

    if (statusFilter !== 'all') {
      filtered = filtered.filter((g) => g.status === statusFilter);
    }

    if (search.trim()) {
      filtered = filtered.filter(
        (g) =>
          g.name.toLowerCase().includes(search.toLowerCase()) ||
          g.creator.toLowerCase().includes(search.toLowerCase())
      );
    }

    switch (sortOption) {
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'members':
        filtered.sort((a, b) => b.membersCount - a.membersCount);
        break;
      default:
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    setGroups(filtered);
  }, [search, statusFilter, sortOption]);

  const toggleStatus = (id, newStatus) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === id ? { ...g, status: newStatus } : g))
    );
  };

  const handleDelete = (id) => {
    const confirmDelete = confirm('Are you sure you want to delete this group?');
    if (confirmDelete) {
      setGroups((prev) => prev.filter((g) => g.id !== id));
      setSelectedGroups((prev) => prev.filter((gid) => gid !== id));
    }
  };

  const handleBulkDelete = () => {
    const confirmDelete = confirm('Delete selected groups?');
    if (confirmDelete) {
      setGroups((prev) => prev.filter((g) => !selectedGroups.includes(g.id)));
      setSelectedGroups([]);
    }
  };

  const exportToCSV = () => {
    const header = ['ID', 'Name', 'Creator', 'Status', 'Members', 'Public', 'CreatedAt', 'Category'];
    const rows = groups.map(g => [g.id, g.name, g.creator, g.status, g.membersCount, g.isPublic, g.createdAt, g.category]);
    const csvContent = [header, ...rows].map(e => e.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'groups.csv');
    link.click();
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
            <button
              onClick={handleBulkDelete}
              className="bg-red-500 text-white px-3 py-2 rounded text-sm"
            >
              Delete Selected ({selectedGroups.length})
            </button>
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
            {paginatedGroups.map((group) => (
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
                  src={group.image}
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
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {group.status}
                  </span>
                </div>

                <p className="text-xs bg-gray-800 text-white inline-block px-2 py-0.5 rounded">
                  📁 {group.category}
                </p>

                <p className="text-sm text-gray-600">👤 {group.creator}</p>
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
                    <button
                      onClick={() => toggleStatus(group.id, 'suspended')}
                      className="bg-yellow-500 text-white px-3 py-1 rounded flex items-center gap-1 text-sm"
                    >
                      <FaToggleOff /> Suspend
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
            ))}
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
    </AdminLayout>
  );
}
