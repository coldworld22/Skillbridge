// ✅ Enhanced Community Landing Page with Full Features
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaUserCircle, FaCommentDots, FaUsers, FaPlus, FaSearch } from "react-icons/fa";
import Link from "next/link";
import Navbar from "@/components/website/sections/Navbar";

const CommunityLandingPage = () => {
  const [discussions, setDiscussions] = useState([]);
  const [contributors, setContributors] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [tags] = useState(["React", "AI", "Odoo", "Next.js", "Docker"]);

  useEffect(() => {
    // Simulate fetch
    setDiscussions([
      { id: 1, title: "How to build a full-stack application?", user: "John Doe", replies: 15 },
      { id: 2, title: "Best resources for learning AI?", user: "Jane Smith", replies: 20 },
      { id: 3, title: "How to improve UI/UX design skills?", user: "Emily Johnson", replies: 12 },
    ]);

    setContributors([
      { name: "John Doe", contributions: 50, reputation: 800, avatar: "/avatars/john.png" },
      { name: "Jane Smith", contributions: 45, reputation: 720, avatar: "/avatars/jane.png" },
      { name: "Emily Johnson", contributions: 38, reputation: 650, avatar: "" },
    ]);
  }, []);

  const getBadge = (count) => {
    if (count >= 50) return "🥇";
    if (count >= 30) return "🥈";
    if (count >= 10) return "🥉";
    return "";
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <Navbar />
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        viewport={{ once: true }}
        className="py-16 text-center px-4"
      >
        <h1 className="text-4xl font-bold text-yellow-500 mb-4">Welcome to the Community</h1>
        <p className="text-lg text-gray-400 mb-6">Ask questions, get answers, and connect with top contributors!</p>

        {/* Ask Question CTA */}
        <Link href="/community/ask">
          <button className="mb-10 px-6 py-3 bg-yellow-500 text-gray-900 font-bold rounded-lg hover:bg-yellow-600 flex items-center gap-2 mx-auto">
            <FaPlus /> Ask a Question
          </button>
        </Link>

        {/* Search Bar */}
        <div className="max-w-lg mx-auto mb-10 relative">
          <input
            type="text"
            placeholder="Search discussions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-600 focus:outline-none text-white"
          />
          <FaSearch className="absolute right-3 top-3 text-gray-400" />
        </div>

        {/* Popular Tags */}
        <div className="mb-10">
          <h4 className="text-xl font-semibold mb-2">Popular Tags</h4>
          <div className="flex flex-wrap justify-center gap-2">
            {tags.map((tag) => (
              <span key={tag} className="bg-yellow-600 px-3 py-1 rounded-full text-sm text-white cursor-pointer hover:bg-yellow-500 transition">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 max-w-6xl mx-auto">
          {/* Trending Discussions */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <FaCommentDots className="text-yellow-500" /> Trending Discussions
            </h3>
            <ul className="space-y-4">
              {discussions.filter(d => d.title.toLowerCase().includes(searchQuery.toLowerCase())).map((discussion) => (
                <motion.li
                  key={discussion.id}
                  className="p-4 bg-gray-700 rounded-lg flex justify-between items-center hover:bg-gray-600 cursor-pointer transition"
                  whileHover={{ scale: 1.03 }}
                  onClick={() => window.location.href = `/community/questions/${discussion.id}`}
                >
                  <div>
                    <h4 className="text-lg font-semibold">{discussion.title}</h4>
                    <p className="text-gray-400">By {discussion.user}</p>
                  </div>
                  <span className="bg-yellow-500 text-gray-900 px-3 py-1 rounded-full text-sm font-semibold">
                    {discussion.replies} Replies
                  </span>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Top Contributors */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <FaUsers className="text-yellow-500" /> Top Contributors
            </h3>
            <ul className="space-y-4">
              {contributors.map((contributor, index) => (
                <motion.li
                  key={index}
                  className="p-4 bg-gray-700 rounded-lg flex justify-between items-center hover:bg-gray-600 transition"
                  whileHover={{ scale: 1.03 }}
                >
                  <div className="flex items-center gap-3">
                    <img src={contributor.avatar || "/images/default-avatar.png"} className="w-10 h-10 rounded-full border border-gray-500" />
                    <div>
                      <h4 className="text-lg font-semibold">{contributor.name} {getBadge(contributor.contributions)}</h4>
                      <p className="text-gray-400 text-sm">{contributor.contributions} Contributions • {contributor.reputation} Reputation</p>
                    </div>
                  </div>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>

        {/* CTA to Explore More */}
        <motion.div className="mt-12" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Link href="/community">
            <button className="px-6 py-3 bg-yellow-500 text-gray-900 rounded-lg font-semibold hover:bg-yellow-600 transition shadow-lg">
              Explore the Community
            </button>
          </Link>
        </motion.div>

        {/* Join Prompt */}
        <motion.div className="mt-6 text-sm text-gray-400">
          Not a member yet? <Link href="/auth/register" className="text-yellow-400 hover:underline">Join now</Link> and start contributing!
        </motion.div>
      </motion.section>
    </div>
  );
};

export default CommunityLandingPage;