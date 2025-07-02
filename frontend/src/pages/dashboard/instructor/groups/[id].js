import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import InstructorLayout from '@/components/layouts/InstructorLayout';
import toast from 'react-hot-toast';
import Link from 'next/link';
import GroupChat from '@/components/chat/GroupChat';
import GroupMembersList from '@/components/groups/GroupMembersList';
import GroupPermissionSettings from '@/components/groups/GroupPermissionSettings';
import groupService from '@/services/groupService';
import JoinRequestCard from '@/components/groups/JoinRequestCard';
import useAuthStore from '@/store/auth/authStore';

export default function GroupDetailsPage() {
  const router = useRouter();
  const { id: groupId } = router.query;

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joinStatus, setJoinStatus] = useState('none');
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const { user, hasHydrated } = useAuthStore();

  const [members, setMembers] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // Avoid running when navigating away from this page. When the route
    // changes, Next.js reuses the component briefly with the new query
    // params, which previously caused a redirect to the group explore page.
    if (router.pathname !== '/dashboard/instructor/groups/[id]') return;
    if (!router.isReady || !groupId || !hasHydrated) return;

    const load = async () => {
      try {
        const data = await groupService.getGroupById(groupId);
        if (!data) {
          toast.error('Group not found.');
          router.push('/dashboard/instructor/groups/explore');
          return;
        }
        setGroup(data);

        const mem = await groupService.getGroupMembers(groupId);
        setMembers(mem);

        let role = null;
        if (user) {
          if (String(user.id) === String(data.creator_id)) {
            setIsAdmin(true);
            setJoinStatus('joined');
            role = 'admin';
          } else {
            const member = mem.find((m) => String(m.id) === String(user.id));
            if (member) {
              setJoinStatus('joined');
              role = member.role;
              if (member.role === 'admin') setIsAdmin(true);
            } else {
              setJoinStatus('none');
            }
          }
        }
        setCurrentUserRole(role);
      } catch (err) {
        toast.error('Failed to load group.');
        router.push('/dashboard/instructor/groups/explore');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [router.isReady, groupId, user, hasHydrated]);

  useEffect(() => {
    if (!groupId || !isAdmin) return;
    groupService
      .getJoinRequestsForGroup(groupId)
      .then((list) => setPendingCount(Array.isArray(list) ? list.length : 0))
      .catch(() => setPendingCount(0));
  }, [groupId, isAdmin]);

  const handleJoin = async () => {
    try {
      setJoinStatus('pending');
      await groupService.joinGroup(groupId);
      toast.success('Join request sent!');
    } catch (err) {
      setJoinStatus('none');
      toast.error('Failed to send join request');
    }
  };

  if (loading || !group) {
    return (
      <InstructorLayout>
        <div className="p-6 text-center text-gray-500">⏳ Loading group...</div>
      </InstructorLayout>
    );
  }

  const tabs = ['overview'];
  if (joinStatus === 'joined') {
    tabs.push('chat');
    tabs.push('members');
    if (isAdmin) tabs.push('member-management');
  }

  return (
    <InstructorLayout>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Link href="/dashboard/instructor/groups/my-groups">
          <button className="text-sm text-blue-600 hover:underline">&larr; Back to My Groups</button>
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{group.name}</h1>
            {(group.creator || group.creator_id) && (

              <p className="text-sm text-gray-500">
                👑 Creator:{' '}

                <span>{group.creator || group.creator_id}</span>

              </p>

            )}
          </div>
          <span className="text-sm text-gray-500">
            📅 {new Date(group.created_at).toLocaleDateString()}
          </span>
        </div>

        <div className="flex gap-4 border-b pb-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-1 text-sm font-medium ${
                activeTab === tab ? 'border-b-2 border-yellow-500 text-yellow-600' : 'text-gray-500'
              }`}
            >
              {tab === 'member-management' ? (
                <>
                  Member Management
                  {pendingCount > 0 && (
                    <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-red-600 text-white">
                      {pendingCount}
                    </span>
                  )}
                </>
              ) : (
                tab.charAt(0).toUpperCase() + tab.slice(1)
              )}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-4">
            <img
              src={group.cover_image || group.image}
              alt={group.name}
              className="w-full h-48 object-cover rounded-xl"
            />
            <p className="text-gray-700">{group.description}</p>
            {Array.isArray(group.tags) && group.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {group.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full bg-gray-100 text-sm text-gray-700"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {joinStatus === 'none' && (
              <button
                onClick={handleJoin}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg"
              >
                Join Group
              </button>
            )}
            {joinStatus === 'pending' && (
              <div className="text-yellow-700 font-semibold">⏳ Join request pending approval</div>
            )}
            {joinStatus === 'joined' && (
              <div className="text-green-600 font-semibold">✅ You are a member of this group</div>
            )}
              <div className="pt-4">
                <h2 className="text-sm font-medium mb-1">
                  👥 Members ({members.length})
                </h2>
                <div className="flex flex-col gap-2 mt-1">
                  {members.map((m) => (
                    <div key={m.id} className="flex items-center gap-2 text-sm">
                      <img
                        src={m.avatar}
                        className="w-8 h-8 rounded-full border"
                        alt={m.name}
                      />
                      <span>{m.name}</span>
                    </div>
                  ))}
                </div>
              </div>
          </div>
        )}

        {activeTab === 'chat' && joinStatus === 'joined' && (
          <>
            <GroupChat groupId={group.id} groupName={group.name} />
              <div className="mt-6">
                <h2 className="text-sm font-medium mb-1">
                  👥 Members ({members.length})
                </h2>
                <div className="flex flex-col gap-2 mt-1">
                  {members.map((m) => (
                    <div key={m.id} className="flex items-center gap-2 text-sm">
                      <img
                        src={m.avatar}
                        className="w-8 h-8 rounded-full border"
                        alt={m.name}
                      />
                      <span>{m.name}</span>
                    </div>
                  ))}
                </div>
              </div>
          </>
        )}

        {activeTab === 'members' && joinStatus === 'joined' && (
          <div className="space-y-4">
            <GroupMembersList
              groupId={group.id}
              currentUserId={user?.id}
              canManage={isAdmin || currentUserRole === 'moderator'}
            />
          </div>
        )}

        {activeTab === 'member-management' && isAdmin && (
          <div className="space-y-4">
            <div className="pt-4">
              <h2 className="text-sm font-medium mb-1">Pending Requests</h2>

              <JoinRequestCard groupId={group.id} onCountChange={setPendingCount} />

            </div>
            <GroupPermissionSettings groupId={group.id} />
          </div>
        )}
      </div>
    </InstructorLayout>
  );
}