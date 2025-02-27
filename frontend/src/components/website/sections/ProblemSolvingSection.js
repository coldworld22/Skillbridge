import { motion } from "framer-motion";
import { FaLightbulb, FaCode, FaTrophy, FaUsers } from "react-icons/fa";

const ProblemSolvingSection = () => {
  return (

    <motion.section
  initial={{ opacity: 0, y: 50 }}
  whileInView={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.8, ease: "easeOut" }}
  viewport={{ once: true }}
>
<section className="relative w-full py-20 bg-gray-900 text-white text-center">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Heading */}
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-4xl font-extrabold mb-6 text-yellow-500"
        >
          Real-World Challenges, Interactive Solutions
        </motion.h2>

        {/* Section Description */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="text-lg text-gray-300 mb-12 max-w-3xl mx-auto"
        >
          Solve industry-level problems, collaborate with experts, and showcase your skills in real-world scenarios.
        </motion.p>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Feature 1 */}
          <motion.div whileHover={{ scale: 1.05 }} className="p-6 bg-gray-800 rounded-lg shadow-lg">
            <FaLightbulb className="text-yellow-500 text-4xl mb-4 mx-auto" />
            <h3 className="text-xl font-bold">Innovative Challenges</h3>
            <p className="text-gray-400 mt-2">Work on AI, Web, Data Science, and real-world business challenges.</p>
          </motion.div>

          {/* Feature 2 */}
          <motion.div whileHover={{ scale: 1.05 }} className="p-6 bg-gray-800 rounded-lg shadow-lg">
            <FaCode className="text-yellow-500 text-4xl mb-4 mx-auto" />
            <h3 className="text-xl font-bold">Hands-On Coding</h3>
            <p className="text-gray-400 mt-2">Submit solutions, get feedback, and improve your coding skills.</p>
          </motion.div>

          {/* Feature 3 */}
          <motion.div whileHover={{ scale: 1.05 }} className="p-6 bg-gray-800 rounded-lg shadow-lg">
            <FaTrophy className="text-yellow-500 text-4xl mb-4 mx-auto" />
            <h3 className="text-xl font-bold">Earn Recognition</h3>
            <p className="text-gray-400 mt-2">Get featured in leaderboards and receive skill badges.</p>
          </motion.div>

          {/* Feature 4 */}
          <motion.div whileHover={{ scale: 1.05 }} className="p-6 bg-gray-800 rounded-lg shadow-lg">
            <FaUsers className="text-yellow-500 text-4xl mb-4 mx-auto" />
            <h3 className="text-xl font-bold">Collaborate</h3>
            <p className="text-gray-400 mt-2">Work with industry mentors and join a global community.</p>
          </motion.div>
        </div>

        {/* CTA Button */}
        <motion.div className="mt-12" whileHover={{ scale: 1.1 }}>
          <a href="/challenges" className="px-8 py-4 bg-yellow-500 text-gray-900 rounded-lg font-semibold text-lg shadow-lg hover:bg-yellow-600 transition">
            Start Solving Challenges
          </a>
        </motion.div>
      </div>
    </section>
</motion.section>


    
  );
};

export default ProblemSolvingSection;
