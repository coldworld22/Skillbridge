import { motion } from "framer-motion";
import Image from "next/image";
import { FaBrain, FaRobot, FaChalkboardTeacher, FaLightbulb } from "react-icons/fa";
import aiIllustration from "@/shared/assets/images/home/ai-tutor.png"; // Ensure correct path

const AITutoring = () => {
  return (

    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      viewport={{ once: true }}
    >
      <section className="relative w-full py-20 bg-gray-900 text-white text-center overflow-hidden">
        {/* Background Animation */}
        <div className="absolute inset-0 opacity-10 bg-cover bg-center" style={{ backgroundImage: `url(${aiIllustration.src})` }}></div>

        {/* Content Section */}
        <div className="relative z-10 max-w-6xl mx-auto px-6">
          {/* Headline */}
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-4xl md:text-5xl font-extrabold mb-6"
          >
            Personalized AI Tutoring – Learn Smarter, Not Harder
          </motion.h2>

          {/* Description */}
          <p className="text-lg md:text-xl text-gray-300 mb-8">
            Get instant feedback, adaptive lesson plans, and AI-powered tutoring to enhance your learning journey.
          </p>

          {/* AI Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* AI Lesson Planner */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="p-6 bg-gray-800 rounded-lg shadow-lg flex flex-col items-center text-center"
            >
              <FaBrain size={40} className="text-yellow-500 mb-4" />
              <h3 className="text-xl font-bold">AI Lesson Planner</h3>
              <p className="text-gray-400 mt-2">Generate personalized study plans based on your skills and goals.</p>
            </motion.div>

            {/* Smart Quiz & Feedback */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="p-6 bg-gray-800 rounded-lg shadow-lg flex flex-col items-center text-center"
            >
              <FaLightbulb size={40} className="text-yellow-500 mb-4" />
              <h3 className="text-xl font-bold">Smart Quiz & Feedback</h3>
              <p className="text-gray-400 mt-2">Receive AI-generated quizzes and real-time feedback for better learning.</p>
            </motion.div>

            {/* AI Tutor Chat */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="p-6 bg-gray-800 rounded-lg shadow-lg flex flex-col items-center text-center"
            >
              <FaRobot size={40} className="text-yellow-500 mb-4" />
              <h3 className="text-xl font-bold">AI Tutor Chat</h3>
              <p className="text-gray-400 mt-2">Interact with an AI tutor that answers your questions in real-time.</p>
            </motion.div>

            {/* Personalized Study Paths */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="p-6 bg-gray-800 rounded-lg shadow-lg flex flex-col items-center text-center"
            >
              <FaChalkboardTeacher size={40} className="text-yellow-500 mb-4" />
              <h3 className="text-xl font-bold">Personalized Study Paths</h3>
              <p className="text-gray-400 mt-2">Tailored learning journeys based on your interests and progress.</p>
            </motion.div>
          </div>

          {/* Call-to-Action Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            className="mt-10 px-6 py-3 bg-yellow-500 text-gray-900 font-semibold text-lg rounded-lg shadow-lg hover:bg-yellow-600 transition"
          >
            Try AI Tutoring Now
          </motion.button>
        </div>
      </section>
    </motion.section>


  );
};

export default AITutoring;
