import { useEffect, useState } from 'react';
import Link from 'next/link';
import InstructorLayout from '@/components/layouts/InstructorLayout';
import toast from 'react-hot-toast';
import groupService from '@/services/groupService';


export default function MyGroupsPage() {
  const [groups, setGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [visibleCount, setVisibleCount] = useState(6);

  const tabs = ['all', 'admin', 'member', 'pending'];

  useEffect(() => {
    groupService.getMyGroups().then(setGroups).catch(() => toast.error('Failed to load groups'));
  }, []);

  useEffect(() => {
    let filtered = activeTab === 'all' ? groups : groups.filter((g) => g.role === activeTab);

    if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sortBy === 'az') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    setFilteredGroups(filtered);
  }, [groups, activeTab, sortBy]);

  const cancelJoinRequest = (groupId) => {
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    toast.success('Join request cancelled.');
  };

  const renderGroupCard = (group) => (
    <div key={group.id} className="bg-white border rounded-lg p-4 shadow space-y-2 hover:shadow-md transition">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{group.name}</h3>
        <span
          className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium capitalize ${
            group.role === 'admin'
              ? 'bg-green-100 text-green-700'
              : group.role === 'member'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {group.role === 'admin' && '👑 Admin'}
          {group.role === 'member' && '🙋 Member'}
          {group.role === 'pending' && '⏳ Pending'}
        </span>
      </div>
      <img
        src={group.cover_image || group.image}
        alt={group.name}
        className="w-full h-32 object-cover rounded"
      />
      <p className="text-sm text-gray-600">{group.description}</p>

      <p className="text-xs text-gray-500">
        👥 {group.membersCount ?? group.members_count ?? 0} members
      </p>

      <div className="flex -space-x-2 pt-1">
        {[...Array(3)].map((_, i) => (
          <img
            key={i}
            src={`https://i.pravatar.cc/40?img=${i + 1}`}
            className="w-6 h-6 rounded-full border"
            alt="member avatar"
          />
        ))}
      </div>

      <div className="pt-2 flex gap-2">
        {group.role === 'admin' && (
          <Link href={`/dashboard/instructor/groups/${group.id}`}>
            <button className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700 text-sm">
              Manage Group
            </button>
          </Link>
        )}
        {group.role === 'member' && (
          <Link href={`/dashboard/instructor/groups/${group.id}`}>
            <button className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 text-sm">
              Open Group
            </button>
          </Link>
        )}
        {group.role === 'pending' && (
          <>
            <button
              disabled
              className="bg-yellow-400 text-white px-4 py-1 rounded text-sm cursor-not-allowed"
            >
              Waiting Approval
            </button>
            <button
              onClick={() => cancelJoinRequest(group.id)}
              className="text-red-500 text-sm underline ml-1"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <InstructorLayout>
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold">📂 My Groups</h1>

        {/* Tab Navigation */}
        <div className="flex gap-3 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded-full text-sm font-medium border ${
                activeTab === tab
                  ? 'bg-yellow-500 text-white border-yellow-500'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'
              }`}
            >
              {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="ml-auto px-2 py-1 text-sm border rounded"
          >
            <option value="newest">🆕 Newest</option>
            <option value="az">🔤 A-Z</option>
          </select>
        </div>

        {/* Group Cards */}
        {filteredGroups.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredGroups.slice(0, visibleCount).map(renderGroupCard)}
            </div>
            {visibleCount < filteredGroups.length && (
              <div className="flex justify-center mt-4">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 6)}
                  className="px-4 py-2 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600"
                >
                  Load More
                </button>
              </div>
            )}
          </>
        ) : (
          <p className="text-gray-500">
            No groups in this category.{' '}
            <Link href="/dashboard/instructor/groups/explore" className="text-blue-600 underline">
              Explore public groups
            </Link>
          </p>
        )}
      </div>
    </InstructorLayout>
  );
}
