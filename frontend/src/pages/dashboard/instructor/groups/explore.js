import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import InstructorLayout from '@/components/layouts/InstructorLayout';
import toast from 'react-hot-toast';
import groupService from '@/services/groupService';

const MEMBER_ROLES = new Set(['admin', 'member']);

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

  const roleMapRef = useRef({});
  const membersMapRef = useRef({});

  useEffect(() => {
    roleMapRef.current = roleMap;
  }, [roleMap]);

  useEffect(() => {
    membersMapRef.current = membersMap;
  }, [membersMap]);

  const applyMembershipToGroups = useCallback(
    (list, nextRoleMap) =>
      list.map((group) => ({
        ...group,
        myRole: nextRoleMap[group.id] ?? null,
      })),
    [],
  );

  const fetchGroupMembers = useCallback(async (groupIds) => {
    if (!groupIds.length) return {};
    const map = {};
    await Promise.all(
      groupIds.map(async (gid) => {
        try {
          map[gid] = await groupService.getGroupMembers(gid);
        } catch {
          map[gid] = membersMapRef.current[gid] || [];
        }
      }),
    );
    return map;
  }, []);

  const refreshMemberships = useCallback(
    async ({ silent = false, fetchMembers = true } = {}) => {
      try {
        const mine = await groupService.getMyGroups().catch(() => []);
        const nextRoleMap = {};
        mine.forEach((g) => {
          nextRoleMap[g.id] = g.role;
        });

        const pendingIds = mine
          .filter((g) => g.role === 'pending')
          .map((g) => g.id);

        setRoleMap(nextRoleMap);
        setJoinRequests(pendingIds);
        setGroups((prev) => applyMembershipToGroups(prev, nextRoleMap));

        if (fetchMembers) {
          const previous = roleMapRef.current;
          const toFetch = mine
            .filter(
              (g) =>
                MEMBER_ROLES.has(g.role) && previous[g.id] !== g.role,
            )
            .map((g) => g.id);

          if (toFetch.length) {
            const updates = await fetchGroupMembers(toFetch);
            setMembersMap((prev) => ({ ...prev, ...updates }));
          }
        }
      } catch (err) {
        if (!silent) {
          toast.error('Failed to refresh group memberships');
        }
      }
    },
    [applyMembershipToGroups, fetchGroupMembers],
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [all, mine] = await Promise.all([
          groupService.getPublicGroups(),
          groupService.getMyGroups().catch(() => []),
        ]);

        const nextRoleMap = {};
        mine.forEach((g) => {
          nextRoleMap[g.id] = g.role;
        });

        setRoleMap(nextRoleMap);

        const pendingIds = mine
          .filter((g) => g.role === 'pending')
          .map((g) => g.id);
        setJoinRequests(pendingIds);

        const hydratedGroups = applyMembershipToGroups(all, nextRoleMap);
        setGroups(hydratedGroups);
        setFilteredGroups(hydratedGroups);

        const memberGroupIds = mine
          .filter((g) => MEMBER_ROLES.has(g.role))
          .map((g) => g.id);

        if (memberGroupIds.length) {
          const memberData = await fetchGroupMembers(memberGroupIds);
          setMembersMap(memberData);
        } else {
          setMembersMap({});
        }
      } catch (err) {
        toast.error('Failed to load groups');
      }
    };

    fetchData();
    groupService.getTags().then(setTags).catch(() => {});
  }, [applyMembershipToGroups, fetchGroupMembers]);

  useEffect(() => {
    const toFetch = Object.entries(roleMap)
      .filter(
        ([gid, role]) =>
          MEMBER_ROLES.has(role) && !(gid in membersMapRef.current),
      )
      .map(([gid]) => gid);
    if (!toFetch.length) return;

    let cancelled = false;
    (async () => {
      const updates = await fetchGroupMembers(toFetch);
      if (!cancelled) {
        setMembersMap((prev) => ({ ...prev, ...updates }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [roleMap, fetchGroupMembers]);

  useEffect(() => {
    if (!joinRequests.length) return;
    const interval = setInterval(() => {
      refreshMemberships({ silent: true });
    }, 10000);
    return () => clearInterval(interval);
  }, [joinRequests.length, refreshMemberships]);

  useEffect(() => {
    let filtered = [...groups];

    if (searchTerm) {
      filtered = filtered.filter(
        (g) =>
          g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (g.tags || []).some((tag) =>
            tag.toLowerCase().includes(searchTerm.toLowerCase()),
          ),
      );
    }

    if (selectedTag) {
      filtered = filtered.filter((g) =>
        (g.tags || []).includes(selectedTag),
      );
    }

    if (sortBy === 'newest') {
      filtered.sort(
        (a, b) =>
          new Date(b.createdAt || b.created_at) -
          new Date(a.createdAt || a.created_at),
      );
    } else if (sortBy === 'members') {
      filtered.sort((a, b) => b.membersCount - a.membersCount);
    } else if (sortBy === 'az') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    setFilteredGroups(filtered);
  }, [searchTerm, selectedTag, sortBy, groups]);

  const handleJoin = async (groupId) => {
    try {
      const result = await groupService.joinGroup(groupId);
      const payload = result?.data ?? {};
      const joinStatus = payload.status;
      const nextRole =
        payload.role ||
        (joinStatus === 'pending' ? 'pending' : 'member');

      if (joinStatus === 'pending') {
        setJoinRequests((prev) =>
          prev.includes(groupId) ? prev : [...prev, groupId],
        );
      } else if (joinStatus === 'member') {
        setJoinRequests((prev) =>
          prev.filter((id) => id !== groupId),
        );
        try {
          const refreshedMembers =
            await groupService.getGroupMembers(groupId);
          setMembersMap((prev) => ({
            ...prev,
            [groupId]: refreshedMembers,
          }));
        } catch {
          setMembersMap((prev) => ({
            ...prev,
            [groupId]: prev[groupId] || [],
          }));
        }
      }

      setRoleMap((prev) => ({ ...prev, [groupId]: nextRole }));
      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId ? { ...g, myRole: nextRole } : g,
        ),
      );

      refreshMemberships({ silent: true, fetchMembers: false });

      const message =
        result?.message ||
        (joinStatus === 'pending'
          ? 'Join request sent!'
          : 'Joined group successfully!');
      toast.success(message);
    } catch (error) {
      refreshMemberships({ silent: true, fetchMembers: false });
      toast.error(
        error?.response?.data?.message || 'Failed to join group',
      );
    }
  };

  const handleCancelJoin = async (groupId) => {
    try {
      await groupService.cancelJoinRequest(groupId);
      setJoinRequests((prev) =>
        prev.filter((id) => id !== groupId),
      );
      setRoleMap((prev) => {
        const next = { ...prev };
        delete next[groupId];
        return next;
      });
      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId ? { ...g, myRole: null } : g,
        ),
      );
      refreshMemberships({ silent: true, fetchMembers: false });
      toast.success('Join request cancelled');
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          'Failed to cancel request',
      );
    }
  };

  return (
    <InstructorLayout>
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">🌐 Explore Public Groups</h1>
          <Link href="/dashboard/instructor/groups/create">
            <button className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded shadow">
              + Create Group
            </button>
          </Link>
        </div>

        <div className="flex flex-wrap gap-4 items-center justify-between">
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

        {filteredGroups.length === 0 ? (
          <p className="text-gray-500">
            No groups found.{' '}
            <Link
              href="/dashboard/instructor/groups/create"
              className="text-blue-600 underline"
            >
              Create one?
            </Link>
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-4">
            {filteredGroups.map((group) => {
              const role =
                group.myRole ?? roleMap[group.id] ?? null;
              const requestPending =
                role === 'pending' || joinRequests.includes(group.id);
              const isMember = MEMBER_ROLES.has(role);
              const joinLabel =
                role === 'admin'
                  ? 'Your group'
                  : role === 'member'
                  ? 'Member'
                  : 'Join Group';

              return (
                <div
                  key={group.id}
                  className="p-4 bg-white rounded-xl shadow hover:shadow-md transition space-y-3 border"
                >
                  <img
                    src={
                      group.cover_image ||
                      group.image ||
                      '/images/group-placeholder.jpg'
                    }
                    onError={(e) => {
                      e.target.src = '/images/group-placeholder.jpg';
                    }}
                    alt={group.name}
                    className="w-full h-32 object-cover rounded-lg"
                  />

                  <div className="flex justify-between items-start gap-3">
                    <h2 className="text-lg font-bold">{group.name}</h2>
                    <div className="flex flex-col items-end gap-1 text-xs">
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                        {group.isPublic ? 'Public' : 'Private'}
                      </span>
                      {group.requiresApproval && (
                        <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                          Approval required
                        </span>
                      )}
                    </div>
                  </div>

                  {group.creator && (
                    <p className="text-xs text-gray-500">👤 {group.creator}</p>
                  )}

                  <p className="text-sm text-gray-600 line-clamp-2">
                    {group.description}
                  </p>

                  <p className="text-xs text-gray-500">
                    👥 {group.membersCount} members
                  </p>
                  <p className="text-xs text-gray-400">
                    📅{' '}
                    {group.createdAt
                      ? new Date(group.createdAt).toLocaleDateString()
                      : ''}
                  </p>

                  <div className="flex flex-wrap gap-2 text-sm">
                    {Array.isArray(group.tags) && group.tags.length > 0 ? (
                      group.tags.map((tag) => (
                        <span
                          key={tag}
                          className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded"
                        >
                          #{tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400">No tags</span>
                    )}
                  </div>

                  <div className="flex items-center pt-1">
                    <div className="flex -space-x-2 overflow-hidden">
                      {(membersMap[group.id] || [])
                        .slice(0, 4)
                        .map((member, index) => (
                          <img
                            key={`${member.id}-${index}`}
                            className="w-6 h-6 rounded-full border-2 border-white"
                            src={member.avatar}
                            alt={member.name}
                          />
                        ))}
                    </div>
                  </div>

                  {requestPending ? (
                    <>
                      <button
                        onClick={() => handleCancelJoin(group.id)}
                        className="mt-2 w-full px-4 py-2 rounded text-sm bg-gray-200 text-gray-700 hover:bg-gray-300"
                      >
                        Cancel request
                      </button>
                      <p className="text-xs text-yellow-700 text-center">
                        Awaiting approval
                      </p>
                    </>
                  ) : (
                    <button
                      onClick={() => handleJoin(group.id)}
                      disabled={isMember}
                      className={`mt-2 w-full px-4 py-2 rounded text-sm ${
                        isMember
                          ? 'bg-gray-300 cursor-not-allowed text-gray-600'
                          : 'bg-yellow-600 text-white hover:bg-yellow-700'
                      }`}
                    >
                      {joinLabel}
                    </button>
                  )}

                  <Link href={`/dashboard/instructor/groups/${group.id}`}>
                    <button className="text-sm text-blue-600 underline w-full mt-1">
                      View Group
                    </button>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </InstructorLayout>
  );
}
