import { useEffect, useState } from 'react';
import Link from 'next/link';
import InstructorLayout from '@/components/layouts/InstructorLayout';
import toast from 'react-hot-toast';
import groupService from '@/services/groupService';
import useAuthStore from '@/store/auth/authStore';


export default function MyGroupsPage() {
  const [groups, setGroups] = useState([]);
  const [sortBy, setSortBy] = useState('newest');
  const { user, hasHydrated } = useAuthStore();

  useEffect(() => {
    if (!hasHydrated || !user) return;
    groupService
      .getMyGroups()
      .then(setGroups)
      .catch(() => toast.error('Failed to load groups'));
  }, [hasHydrated, user]);


  const sortList = (list) => {
    const arr = [...list];
    if (sortBy === 'newest') {
      arr.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sortBy === 'az') {
      arr.sort((a, b) => a.name.localeCompare(b.name));
    }
    return arr;
  };


  const createdGroups = sortList(
    groups.filter((g) => String(g.creator_id) === String(user?.id))
  );
  const joinedGroups = sortList(
    groups.filter((g) => String(g.creator_id) !== String(user?.id))
  );


  const cancelJoinRequest = (groupId) => {
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    toast.success('Join request cancelled.');
  };

  const renderGroupCard = (group) => (
    <div key={group.id} className="bg-white border rounded-lg p-4 shadow space-y-2 hover:shadow-md transition">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{group.name}</h3>
        <div className="flex gap-1">
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
          {group.status && (
            <span
              className={`text-xs px-2 py-1 rounded-full capitalize font-medium ${
                group.status === 'active'
                  ? 'bg-green-100 text-green-700'
                  : group.status === 'pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : group.status === 'suspended'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {group.status}
            </span>
          )}
        </div>
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

        <div className="flex justify-end mb-4">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-2 py-1 text-sm border rounded"
          >
            <option value="newest">🆕 Newest</option>
            <option value="az">🔤 A-Z</option>
          </select>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-lg font-semibold mb-2">Groups I Created</h2>
            {createdGroups.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {createdGroups.map(renderGroupCard)}
              </div>
            ) : (
              <p className="text-gray-500">You haven't created any groups yet.</p>
            )}
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Groups I've Joined</h2>
            {joinedGroups.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {joinedGroups.map(renderGroupCard)}
              </div>
            ) : (
              <p className="text-gray-500">
                You're not a member of any groups.{' '}
                <Link href="/dashboard/instructor/groups/explore" className="text-blue-600 underline">
                  Explore public groups
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </InstructorLayout>
  );
}
