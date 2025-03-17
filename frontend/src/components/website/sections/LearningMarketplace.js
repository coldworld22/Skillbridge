import { motion } from "framer-motion";
import { FaSearch, FaUserGraduate, FaBookOpen, FaPlus, FaMoneyBillWave, FaClock } from "react-icons/fa";
import Link from "next/link";

const LearningMarketplaceIntro = () => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      viewport={{ once: true }}
      className="relative w-full py-20 bg-gray-900 text-white text-center"
    >
      <div className="max-w-7xl mx-auto px-6">

        {/* Section Heading */}
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl font-extrabold mb-6 text-yellow-500"
        >
          🎓 Learning Marketplace – Find or Offer Classes
        </motion.h2>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-lg text-gray-300 mb-8 max-w-3xl mx-auto"
        >
          Whether you're looking for a **tutor to help you learn** or an **instructor to teach a class**, our **Learning Marketplace** connects students and teachers in one platform.
        </motion.p>

        {/* How it works */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left max-w-5xl mx-auto">
          {/* Step 1: Search */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <FaSearch className="text-yellow-500 text-5xl mb-4" />
            <h3 className="text-xl font-bold mb-2">🔍 Search & Filter</h3>
            <p className="text-gray-400">
              Explore **tutors, live sessions, and learning opportunities**. Filter by **subject, price, and availability**.
            </p>
          </div>

          {/* Step 2: Connect */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <FaUserGraduate className="text-yellow-500 text-5xl mb-4" />
            <h3 className="text-xl font-bold mb-2">👩‍🏫 Connect with Instructors</h3>
            <p className="text-gray-400">
              Browse **detailed tutor profiles**, view **ratings**, and **directly contact instructors** for personalized learning.
            </p>
          </div>

          {/* Step 3: Post an Ad */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <FaPlus className="text-yellow-500 text-5xl mb-4" />
            <h3 className="text-xl font-bold mb-2">📢 Post Your Learning Ad</h3>
            <p className="text-gray-400">
              Need a tutor? Looking to **offer a class**? **Post an ad** in the marketplace to find the right match.
            </p>
          </div>
        </div>

        {/* Marketplace Preview */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-10 max-w-5xl mx-auto"
        >
          <h3 className="text-2xl font-semibold text-yellow-400 mb-4">🔥 Featured Learning Opportunities</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Featured Ad 1 */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col items-center text-center">
              <FaBookOpen className="text-yellow-500 text-5xl mb-4" />
              <h4 className="text-xl font-bold mb-2">Advanced Python Course</h4>
              <p className="text-gray-400 text-sm">📅 Starts: June 30, 2024</p>
              <p className="text-gray-400 text-sm flex items-center gap-2 mt-2">
                <FaMoneyBillWave /> $150/hr
              </p>
              <button className="mt-4 bg-yellow-500 text-gray-900 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-yellow-600 transition">
                <FaUserGraduate /> Contact Instructor
              </button>
            </div>

            {/* Featured Ad 2 */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col items-center text-center">
              <FaBookOpen className="text-yellow-500 text-5xl mb-4" />
              <h4 className="text-xl font-bold mb-2">Ethical Hacking Masterclass</h4>
              <p className="text-gray-400 text-sm">📅 Starts: June 18, 2024</p>
              <p className="text-gray-400 text-sm flex items-center gap-2 mt-2">
                <FaMoneyBillWave /> $100/hr
              </p>
              <button className="mt-4 bg-yellow-500 text-gray-900 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-yellow-600 transition">
                <FaUserGraduate /> Contact Instructor
              </button>
            </div>

            {/* Featured Ad 3 */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col items-center text-center">
              <FaBookOpen className="text-yellow-500 text-5xl mb-4" />
              <h4 className="text-xl font-bold mb-2">Medical Terminology Course</h4>
              <p className="text-gray-400 text-sm">📅 Starts: June 12, 2024</p>
              <p className="text-gray-400 text-sm flex items-center gap-2 mt-2">
                <FaMoneyBillWave /> $30/hr
              </p>
              <button className="mt-4 bg-yellow-500 text-gray-900 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-yellow-600 transition">
                <FaUserGraduate /> Contact Instructor
              </button>
            </div>
          </div>
        </motion.div>

        {/* CTA Button */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-10"
        >
          <Link href="/marketplace">
            <button className="px-6 py-3 bg-yellow-500 text-gray-900 text-lg font-bold rounded-lg shadow-lg hover:bg-yellow-600 transition">
              📍 Explore Learning Marketplace
            </button>
          </Link>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default LearningMarketplaceIntro;
