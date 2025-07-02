import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import groupService from '@/services/groupService';
import useAuthStore from '@/store/auth/authStore';

export default function ExploreGroupsPage() {
  const [groups, setGroups] = useState([]);
  const [search, setSearch] = useState('');
  const { user } = useAuthStore();

  useEffect(() => {
    const load = async () => {
      try {
        const all = await groupService.getPublicGroups();
        setGroups(all);
      } catch {}
    };
    load();
  }, []);

  const filtered = groups.filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      (g.tags || []).some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Explore Groups</h1>
        <Link href="/groups/create" className="text-yellow-600 underline">
          Create Group
        </Link>
      </div>
      <div className="relative max-w-md">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search groups..."
          className="w-full pl-8 pr-4 py-2 border rounded-lg"
        />
        <Search className="absolute left-2 top-2.5 text-gray-400" size={18} />
      </div>
      {filtered.length === 0 ? (
        <p className="text-gray-500">No groups found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filtered.map((group) => {
            const role = user?.role?.toLowerCase() || 'student';
            const target = ['admin', 'superadmin'].includes(role) ? 'admin' : role;
            return (
              <Link
                key={group.id}
                href={`/dashboard/${target}/groups/${group.id}`}
                className="p-4 bg-white rounded-xl shadow space-y-2 border hover:shadow-md block"
              >
                <img
                  src={group.cover_image || 'https://via.placeholder.com/150'}
                  alt={group.name}
                  className="w-full h-32 object-cover rounded"
                />
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold">{group.name}</h2>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                    {group.isPublic ? 'Public' : 'Private'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{group.description}</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  {(group.tags || []).map((tag) => (
                    <span key={tag} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                      #{tag}
                    </span>
                  ))}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
