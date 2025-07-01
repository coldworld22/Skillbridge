import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { FaFilter, FaPlus } from "react-icons/fa";
import groupService from "@/services/groupService";

const StudyGroups = () => {
  const [tags, setTags] = useState([]);
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    groupService.getTags().then(setTags).catch(() => {});
  }, []);

  const filtered = tags.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
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
          </div>

          {filtered.length === 0 ? (
            <p className="text-gray-400">No matching categories found.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((tag) => (
                <div
                  key={tag.id}
                  className="bg-gray-800 rounded-xl shadow-lg p-4 cursor-pointer hover:bg-yellow-500 transition"
                  onClick={() => router.push(`/groups/explore?filter=${tag.slug}`)}
                >
                  <h3 className="text-xl font-semibold mb-1">{tag.name}</h3>
                  <p className="text-sm text-yellow-300">{tag.group_count} groups</p>
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
