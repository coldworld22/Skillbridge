import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { FaFilter, FaPlus } from "react-icons/fa";
import groupService from "@/services/groupService";
import useAuthStore from "@/store/auth/authStore";

const StudyGroups = () => {
  const [groups, setGroups] = useState([]);
  const [search, setSearch] = useState("");
  const { user, hasHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      try {
        const all = await groupService.getPublicGroups();
        if (hasHydrated && user) {
          const mine = await groupService.getMyGroups();
          const myIds = new Set(mine.map((g) => g.id));
          setGroups(all.filter((g) => !myIds.has(g.id)));
        } else {
          setGroups(all);
        }
      } catch {}
    };
    load();
  }, [user, hasHydrated]);

  const filtered = groups.filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      (g.tags || []).some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
      <section className="py-16 bg-gray-900 text-white text-center">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold mb-6 text-yellow-400">📚 Study Groups</h2>
          <p className="text-lg text-gray-300 mb-8">Explore fields and connect with focused learning communities.</p>

          <div className="relative max-w-xl mx-auto mb-8">
            <input
              type="text"
              placeholder="Search by category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full p-3 pl-10 rounded-lg border border-gray-600 focus:ring-2 focus:ring-yellow-500 focus:outline-none text-gray-900"
            />
            <FaFilter className="absolute left-3 top-4 text-gray-500" />
          </div>

          <div className="mb-10 flex justify-center">
            <button
              onClick={() => router.push("/groups/create")}
              className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 px-6 py-3 rounded-lg font-semibold flex items-center gap-2 shadow-lg transition"
            >
              <FaPlus /> Create Study Group
            </button>
            <button
              onClick={() => router.push('/groups/explore')}
              className="ml-4 text-yellow-400 underline"
            >
              View All
            </button>
          </div>

          {filtered.length === 0 ? (
            <p className="text-gray-400">No groups found.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((group) => (
                <div key={group.id} className="p-4 bg-gray-800 rounded-xl shadow hover:shadow-lg transition space-y-2">
                  <img
                    src={group.cover_image || 'https://via.placeholder.com/150'}
                    alt={group.name}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold">{group.name}</h3>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                      {group.isPublic ? 'Public' : 'Private'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 line-clamp-2">{group.description}</p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {(group.tags || []).map((tag) => (
                      <span key={tag} className="bg-gray-700 text-yellow-300 px-2 py-0.5 rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => router.push(`/dashboard/instructor/groups/${group.id}`)}
                    className="text-sm text-yellow-400 underline"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </motion.section>
  );
};

export default StudyGroups;
