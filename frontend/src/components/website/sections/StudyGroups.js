import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { FaFilter, FaPlus, FaSearch, FaUsers } from "react-icons/fa";
import groupService from "@/services/groupService";
import useAuthStore from "@/store/auth/authStore";

const StudyGroups = () => {
  const [groups, setGroups] = useState([]);
  const [search, setSearch] = useState("");
  const { user } = useAuthStore();
  const router = useRouter();

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
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header Section */}
        <div className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 mb-4"
          >
            📚 Collaborative Study Groups
          </motion.h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Join communities of learners, share knowledge, and accelerate your learning journey.
          </p>
        </div>

        {/* Search and Actions */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search groups by name, tags, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full py-4 pl-10 pr-4 rounded-xl border border-gray-700 focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-gray-800 text-white placeholder-gray-500 shadow-lg transition"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <FaFilter className="h-5 w-5 text-gray-400" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-8">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push("/groups/create")}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-gray-900 font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-300"
            >
              <FaPlus className="text-lg" />
              <span>Create New Group</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/groups/explore')}
              className="flex items-center gap-2 text-amber-400 hover:text-amber-300 font-medium py-3 px-6 rounded-xl border border-amber-500 hover:border-amber-400 transition-colors"
            >
              <FaUsers />
              <span>Explore All Groups</span>
            </motion.button>
          </div>
        </div>

        {/* Groups Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-800/50 rounded-2xl p-8 max-w-md mx-auto border border-dashed border-amber-500/30">
              <h3 className="text-xl font-bold text-gray-300 mb-2">No groups found</h3>
              <p className="text-gray-400 mb-4">Try adjusting your search or create a new group</p>
              <button
                onClick={() => router.push("/groups/create")}
                className="text-amber-400 hover:text-amber-300 font-medium underline"
              >
                Create your first group
              </button>
            </div>
          </div>
        ) : (
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {filtered.map((group) => (
              <motion.div
                key={group.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                whileHover={{ 
                  y: -8,
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.1)"
                }}
                className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl overflow-hidden border border-gray-700 shadow-xl"
              >
                <div className="relative h-40 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent z-10" />
                  <img
                    src={group.cover_image || 'https://source.unsplash.com/random/600x400/?study,education'}
                    alt={group.name}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <div className="absolute top-3 right-3 z-20">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${group.isPublic ? 'bg-green-900/70 text-green-300' : 'bg-purple-900/70 text-purple-300'}`}>
                      {group.isPublic ? 'PUBLIC' : 'PRIVATE'}
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold text-white truncate mr-2">{group.name}</h3>
                    <span className="flex items-center text-sm text-amber-400 bg-amber-900/30 px-2 py-1 rounded-full">
                      <FaUsers className="mr-1" /> {group.memberCount || 0}
                    </span>
                  </div>
                  
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2 min-h-[2.5rem]">
                    {group.description || "A collaborative learning community"}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-5">
                    {(group.tags || []).slice(0, 3).map((tag) => (
                      <span 
                        key={tag} 
                        className="text-xs px-2 py-1 bg-gray-700/50 text-amber-300 rounded-lg"
                      >
                        #{tag}
                      </span>
                    ))}
                    {(group.tags || []).length > 3 && (
                      <span className="text-xs px-2 py-1 bg-gray-700/30 text-gray-500 rounded-lg">
                        +{(group.tags || []).length - 3}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      const role = user?.role?.toLowerCase() || "student";
                      const target = ["admin", "superadmin"].includes(role)
                        ? "admin"
                        : role;
                      router.push(`/dashboard/${target}/groups/${group.id}`);
                    }}
                    className="w-full py-2.5 text-center bg-gray-700 hover:bg-gray-600 text-amber-400 rounded-lg font-medium transition-colors"
                  >
                    View Group Details
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.section>
  );
};

export default StudyGroups;