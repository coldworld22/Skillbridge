import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import InstructorLayout from '@/components/layouts/InstructorLayout';
import toast from 'react-hot-toast';
import groupService from '@/services/groupService';

export default function ExploreGroupsPage() {
  const [groups, setGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [joinRequests, setJoinRequests] = useState([]);
  const [tags, setTags] = useState([]);
  const [membersMap, setMembersMap] = useState({});
  const [roleMap, setRoleMap] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [all, mine] = await Promise.all([
          groupService.getPublicGroups(),
          groupService.getMyGroups().catch(() => []),
        ]);

        const rMap = {};
        mine.forEach((g) => {
          rMap[g.id] = g.role;
        });

        const list = all.map((g) => ({ ...g, myRole: rMap[g.id] || null }));
        setRoleMap(rMap);
        setGroups(list);
        setFilteredGroups(list);

        const memberMap = {};
        await Promise.all(
          list.map(async (g) => {
            try {
              memberMap[g.id] = await groupService.getGroupMembers(g.id);
            } catch {
              memberMap[g.id] = [];
            }
          })
        );
        setMembersMap(memberMap);
      } catch (err) {
        toast.error('Failed to load groups');
      }
    };
    fetchData();
    groupService.getTags().then(setTags).catch(() => {});
  }, []);

  useEffect(() => {
    let filtered = [...groups];

    if (searchTerm) {
      filtered = filtered.filter((g) =>
        g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (g.tags || []).some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    if (selectedTag) {
      filtered = filtered.filter((g) => (g.tags || []).includes(selectedTag));
    }

    if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'members') {
      filtered.sort((a, b) => b.membersCount - a.membersCount);
    } else if (sortBy === 'az') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    setFilteredGroups(filtered);
  }, [searchTerm, selectedTag, sortBy, groups]);

  const handleJoin = async (groupId) => {
    try {
      await groupService.joinGroup(groupId);
      setJoinRequests((prev) => [...prev, groupId]);
      setRoleMap((prev) => ({ ...prev, [groupId]: 'pending' }));
      setGroups((prev) =>
        prev.map((g) => (g.id === groupId ? { ...g, myRole: 'pending' } : g))
      );
      toast.success('Join request sent!');
    } catch {
      toast.error('Failed to send join request');
    }
  };

  return (
    <InstructorLayout>
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">🌐 Explore Public Groups</h1>
          <Link href="/dashboard/instructor/groups/create">
            <button className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded shadow">
              + Create Group
            </button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center justify-between">
          {/* Search */}
          <div className="relative w-full max-w-md">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or tag..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              aria-label="Search groups"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border px-3 py-2 rounded-lg"
            aria-label="Sort groups"
          >
            <option value="newest">🆕 Newest</option>
            <option value="members">👥 Most Members</option>
            <option value="az">🔤 A-Z</option>
          </select>
        </div>

        {/* Tag Filters */}
        <div className="flex flex-wrap gap-2 pt-2">
          {tags.map((tag) => (
            <button
              key={tag.id || tag.slug || tag.name}
              onClick={() =>
                setSelectedTag(tag.name === selectedTag ? '' : tag.name)
              }
              className={`px-3 py-1 text-sm rounded-full border ${
                selectedTag === tag.name
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              aria-label={`Filter by tag ${tag.name}`}
            >
              #{tag.name}
            </button>
          ))}
        </div>

        {/* Group Cards */}
        {filteredGroups.length === 0 ? (
          <p className="text-gray-500">
            No groups found.{' '}
            <Link href="/dashboard/instructor/groups/create" className="text-blue-600 underline">
              Create one?
            </Link>
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-4">
            {filteredGroups.map((group) => (
              <div key={group.id} className="p-4 bg-white rounded-xl shadow hover:shadow-md transition space-y-2 border">
                {/* Group Image */}
                <img
                  src={group.cover_image || group.image || '/images/group-placeholder.jpg'}
                  onError={(e) => {
                    e.target.src = '/images/group-placeholder.jpg';
                  }}
                  alt={group.name}
                  className="w-full h-32 object-cover rounded-lg"
                />

                {/* Name and Public tag */}
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold">{group.name}</h2>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                    {group.isPublic ? 'Public' : 'Private'}
                  </span>
                </div>

                {group.creator && (
                  <p className="text-xs text-gray-500">👤 {group.creator}</p>
                )}

                <p className="text-sm text-gray-600 line-clamp-2">{group.description}</p>
                <p className="text-xs text-gray-500">👥 {group.membersCount} members</p>
                <p className="text-xs text-gray-400">📅 {new Date(group.createdAt).toLocaleDateString()}</p>

                {/* Tag list */}
                <div className="flex flex-wrap gap-2 text-sm">
                  {Array.isArray(group.tags) && group.tags.length > 0 ?
                    group.tags.map((tag) => (
                      <span key={tag} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                        #{tag}
                      </span>
                    )) : <span className="text-xs text-gray-400">No tags</span>}
                </div>

                {/* Avatars */}
                <div className="flex items-center pt-1">
                  <div className="flex -space-x-2 overflow-hidden">
                    {(membersMap[group.id] || [])
                      .slice(0, 4)
                      .map((m, i) => (
                        <img
                          key={i}
                          className="w-6 h-6 rounded-full border-2 border-white"
                          src={m.avatar}
                          alt={m.name}
                        />
                      ))}
                  </div>
                </div>

                {/* Join and View buttons */}
                {(() => {
                  const role = group.myRole || roleMap[group.id];
                  const requestSent = role === 'pending' || joinRequests.includes(group.id);
                  const disabled = role === 'admin' || role === 'member' || requestSent;
                  const label =
                    role === 'admin'
                      ? 'Your Group'
                      : role === 'member'
                      ? 'Member'
                      : requestSent
                      ? 'Request Sent'
                      : 'Join Group';
                  return (
                    <button
                      onClick={() => handleJoin(group.id)}
                      disabled={disabled}
                      className={`mt-2 w-full px-4 py-2 rounded text-sm ${
                        disabled
                          ? 'bg-gray-300 cursor-not-allowed'
                          : 'bg-yellow-600 text-white hover:bg-yellow-700'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })()}

                <Link href={`/dashboard/instructor/groups/${group.id}`}>
                  <button className="text-sm text-blue-600 underline w-full mt-1">View Group</button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </InstructorLayout>
  );
}
