import { motion } from "framer-motion";
import { FaUserCircle, FaCommentDots, FaUsers } from "react-icons/fa";

// Dummy Discussion Data
const discussions = [
  {
    id: 1,
    title: "How to build a full-stack application?",
    user: "John Doe",
    replies: 15,
  },
  {
    id: 2,
    title: "Best resources for learning AI?",
    user: "Jane Smith",
    replies: 20,
  },
  {
    id: 3,
    title: "How to improve UI/UX design skills?",
    user: "Emily Johnson",
    replies: 12,
  },
];

// Dummy Featured Contributors
const contributors = [
  { name: "John Doe", contributions: 50 },
  { name: "Jane Smith", contributions: 45 },
  { name: "Emily Johnson", contributions: 38 },
];

const CommunityEngagement = () => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      viewport={{ once: true }}
    >
      <section className="py-16 bg-gray-900 text-white text-center">
        <h2 className="text-4xl font-bold mb-8">Join the Conversation</h2>
        <p className="text-lg text-gray-400 mb-10">
          Connect with other learners, ask questions, and share knowledge!
        </p>

        {/* Community Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">

          {/* Top Discussions */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <FaCommentDots className="text-yellow-500" /> Trending Discussions
            </h3>
            <ul className="space-y-4">
              {discussions.map((discussion) => (
                <motion.li
                  key={discussion.id}
                  className="p-4 bg-gray-700 rounded-lg flex justify-between items-center hover:bg-gray-600 transition"
                  whileHover={{ scale: 1.03 }}
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

          {/* Featured Contributors */}
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
                    <FaUserCircle className="text-gray-400 text-3xl" />
                    <div>
                      <h4 className="text-lg font-semibold">{contributor.name}</h4>
                      <p className="text-gray-400">{contributor.contributions} Contributions</p>
                    </div>
                  </div>
                </motion.li>
              ))}
            </ul>
          </div>

        </div>

        {/* Call to Action */}
        <motion.div
          className="mt-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <button className="px-6 py-3 bg-yellow-500 text-gray-900 rounded-lg font-semibold hover:bg-yellow-600 transition shadow-lg">
            Join the Community
          </button>
        </motion.div>
      </section>
    </motion.section>



  );
};

export default CommunityEngagement;
