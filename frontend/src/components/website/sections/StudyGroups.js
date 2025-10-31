import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { FaFilter, FaPlus, FaSearch, FaSyncAlt, FaUsers } from "react-icons/fa";
import groupService from "@/services/groupService";
import useAuthStore from "@/store/auth/authStore";
import { useTranslation } from "next-i18next";

const StudyGroups = () => {
  const [groups, setGroups] = useState([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const { user } = useAuthStore();
  const router = useRouter();
  const { t } = useTranslation("website");

  const fetchGroups = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const all = await groupService.getPublicGroups();
      setGroups(Array.isArray(all) ? all : []);
    } catch (error) {
      console.error("Failed to fetch public groups", error);
      setLoadError(t("groups_error"));
      setGroups([]);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const normalizedSearch = search.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!normalizedSearch) return groups;
    return groups.filter((group) => {
      const name = String(group.title || group.name || "")
        .toLowerCase();
      const tags = Array.isArray(group.tags) ? group.tags : [];
      const tagMatch = tags.some((tag) =>
        String(tag).toLowerCase().includes(normalizedSearch)
      );
      return name.includes(normalizedSearch) || tagMatch;
    });
  }, [groups, normalizedSearch]);

  const getDashboardSegment = () => {
    const role = user?.role?.toLowerCase();
    if (!role) return "student";
    if (["admin", "superadmin"].includes(role)) return "admin";
    return role;
  };

  const redirectToLogin = (nextPath) => {
    router.push(`/auth/login?next=${encodeURIComponent(nextPath)}`);
  };

  const handleCreateGroup = () => {
    if (!user) {
      redirectToLogin("/dashboard/student/groups/create");
      return;
    }
    const target = getDashboardSegment();
    router.push(`/dashboard/${target}/groups/create`);
  };

  const handleExploreGroups = () => {
    if (!user) {
      redirectToLogin("/dashboard/student/groups/explore");
      return;
    }
    const target = getDashboardSegment();
    router.push(`/dashboard/${target}/groups/explore`);
  };

  const handleViewGroup = (groupId) => {
    if (!user) {
      redirectToLogin(`/dashboard/student/groups/${groupId}`);
      return;
    }
    const target = getDashboardSegment();
    router.push(`/dashboard/${target}/groups/${groupId}`);
  };

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
            📚 {t("groups_heading")}
          </motion.h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            {t("groups_text")}
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
              placeholder={t("search_groups_placeholder")}
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
              onClick={handleCreateGroup}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-gray-900 font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-300"
            >
              <FaPlus className="text-lg" />
              <span>{t("create_group")}</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleExploreGroups}
              className="flex items-center gap-2 text-amber-400 hover:text-amber-300 font-medium py-3 px-6 rounded-xl border border-amber-500 hover:border-amber-400 transition-colors"
            >
              <FaUsers />
              <span>{t("explore_groups")}</span>
            </motion.button>
          </div>
        </div>

        {/* Groups Grid */}
        {isLoading ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center gap-3 bg-gray-800/50 border border-gray-700 rounded-full px-6 py-3 text-gray-300">
              <FaSyncAlt className="animate-spin" />
              <span>{t("groups_loading")}</span>
            </div>
          </div>
        ) : loadError ? (
          <div className="text-center py-12">
            <div className="bg-gray-800/60 rounded-2xl p-8 max-w-md mx-auto border border-red-500/30">
              <h3 className="text-xl font-semibold text-red-300 mb-2">
                {t("groups_error_title")}
              </h3>
              <p className="text-gray-300 mb-5">
                {loadError}
              </p>
              <button
                onClick={fetchGroups}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/80 hover:bg-red-500 text-white font-medium transition"
              >
                <FaSyncAlt className="animate-spin" />
                {t("groups_retry")}
              </button>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-800/50 rounded-2xl p-8 max-w-md mx-auto border border-dashed border-amber-500/30">
              <h3 className="text-xl font-bold text-gray-300 mb-2">{t("no_groups")}</h3>
              <p className="text-gray-400 mb-4">{t("no_groups_hint")}</p>
              <button
                onClick={handleCreateGroup}
                className="text-amber-400 hover:text-amber-300 font-medium underline"
              >
                {t("create_first_group")}
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
                      {group.isPublic ? t("group_public") : t("group_private")}
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold text-white truncate mr-2">
                      {group.title || group.name || t("group_untitled")}
                    </h3>
                    <span className="flex items-center text-sm text-amber-400 bg-amber-900/30 px-2 py-1 rounded-full">
                      <FaUsers className="mr-1" />{" "}
                      {group.membersCount ??
                        group.memberCount ??
                        group.member_count ??
                        0}
                    </span>
                  </div>
                  
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2 min-h-[2.5rem]">
                    {group.description || t("group_default_description")}
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
                    onClick={() => handleViewGroup(group.id)}
                    className="w-full py-2.5 text-center bg-gray-700 hover:bg-gray-600 text-amber-400 rounded-lg font-medium transition-colors"
                  >
                    {t("view_group_details")}
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
