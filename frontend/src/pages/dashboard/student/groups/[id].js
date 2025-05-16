import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import StudentLayout from '@/components/layouts/StudentLayout';
import toast from 'react-hot-toast';
import Link from 'next/link';
import GroupChat from '@/components/chat/GroupChat';
import GroupMembersList from '@/components/groups/GroupMembersList';
import GroupPermissionSettings from '@/components/chat/GroupPermissionSettings';

const mockGroups = [
  {
    id: 'g1',
    name: 'Frontend Wizards',
    description: 'React, Vue, and modern UI lovers',
    tags: ['React', 'Tailwind'],
    isPublic: true,
    membersCount: 128,
    createdAt: '2024-12-01',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTuDDsrSKJXvX7_7I1l6XQMy6BlvfVGqDrdcQ&s',
    createdBy: 'Sarah Johnson',
  },
  {
    id: 'g2',
    name: 'AI Pioneers',
    description: 'Discuss machine learning and AI trends',
    tags: ['AI', 'ML'],
    isPublic: true,
    membersCount: 210,
    createdAt: '2025-01-15',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTuDDsrSKJXvX7_7I1l6XQMy6BlvfVGqDrdcQ&s',
    createdBy: 'Ali Mansour',
  },
];

export default function GroupDetailsPage() {
  const router = useRouter();
  const { id: groupId } = router.query;

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joinStatus, setJoinStatus] = useState('member');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!router.isReady) return;

    const g = mockGroups.find((grp) => grp.id === groupId);
    if (g) {
      setGroup(g);
      setLoading(false);
    } else {
      toast.error('Group not found.');
      router.push('/dashboard/student/groups/explore');
    }
  }, [router.isReady, groupId]);

  const handleJoin = () => {
    setJoinStatus('pending');
    toast.success('Join request sent!');
  };

  if (loading || !group) {
    return (
      <StudentLayout>
        <div className="p-6 text-center text-gray-500">⏳ Loading group...</div>
      </StudentLayout>
    );
  }

  const tabs = ['overview', 'chat', 'members', 'settings'];

  return (
    <StudentLayout>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Link href="/dashboard/student/groups/my-groups">
          <button className="text-sm text-blue-600 hover:underline">&larr; Back to My Groups</button>
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{group.name}</h1>
            <p className="text-sm text-gray-500">👑 Created by {group.createdBy}</p>
          </div>
          <span className="text-sm text-gray-500">
            📅 {new Date(group.createdAt).toLocaleDateString()}
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
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-4">
            <img src={group.image} alt={group.name} className="w-full h-48 object-cover rounded-xl" />
            <p className="text-gray-700">{group.description}</p>
            <div className="flex flex-wrap gap-2">
              {group.tags.map((tag) => (
                <span key={tag} className="px-3 py-1 rounded-full bg-gray-100 text-sm text-gray-700">
                  #{tag}
                </span>
              ))}
            </div>

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
              <h2 className="text-sm font-medium mb-1">👥 Members</h2>
              <div className="flex gap-2 mt-1">
                {[...Array(5)].map((_, i) => (
                  <img
                    key={i}
                    src="https://i.pravatar.cc/40?img=12"
                    className="w-8 h-8 rounded-full border"
                    alt="member avatar"
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <>
            <GroupChat groupId={group.id} />
            <div className="mt-6">
              <h2 className="text-sm font-medium mb-1">👥 Members</h2>
              <div className="flex gap-2 mt-1">
                {[...Array(5)].map((_, i) => (
                  <img
                    key={i}
                    src="https://i.pravatar.cc/40?img=12"
                    className="w-8 h-8 rounded-full border"
                    alt="member avatar"
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'members' && (
          <div className="space-y-4">
            <GroupMembersList />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-4">
            <GroupPermissionSettings groupId={group.id} />
          </div>
        )}
      </div>
    </StudentLayout>
  );
}