import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { 
  FaBrain, FaRobot, FaChalkboardTeacher, FaLightbulb, 
  FaBookOpen, FaChartLine, FaHeadset, FaCertificate 
} from "react-icons/fa";
import aiIllustration from "@/shared/assets/images/home/ai-tutor.png"; // Ensure the correct path

const AITutoring = () => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      viewport={{ once: true }}
    >
      <section className="relative w-full py-24 bg-gray-900 text-white text-center overflow-hidden">
        
        {/* Background Animation */}
        <div className="absolute inset-0 opacity-10 bg-cover bg-center" style={{ backgroundImage: `url(${aiIllustration.src})` }}></div>

        {/* Content Section */}
        <div className="relative z-10 max-w-6xl mx-auto px-8">
          
          {/* Headline & Subheading */}
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-5xl font-extrabold mb-6 text-yellow-400"
          >
            🚀 AI-Powered Tutoring for Smarter Learning
          </motion.h2>
          <p className="text-lg md:text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
            Experience <strong>personalized, AI-driven learning</strong> with real-time feedback, intelligent quiz generation, and adaptive study plans tailored to your progress.
          </p>

          {/* AI Features List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[{
              title: "Adaptive Learning Paths",
              icon: <FaBrain size={40} className="text-yellow-500" />, 
              description: "AI analyzes your strengths & weaknesses to create a customized learning roadmap.",
              link: "/ai-tutoring/lesson-planner"
            }, {
              title: "AI-Generated Quizzes",
              icon: <FaLightbulb size={40} className="text-yellow-500" />, 
              description: "Practice with AI-generated quizzes based on your learning progress.",
              link: "/ai-tutoring/practice"
            }, {
              title: "24/7 AI Chat Tutor",
              icon: <FaRobot size={40} className="text-yellow-500" />, 
              description: "Ask AI-powered tutors any question and receive instant, real-time answers.",
              link: "/ai-tutoring/chat"
            }, {
              title: "Real-Time Feedback",
              icon: <FaChalkboardTeacher size={40} className="text-yellow-500" />, 
              description: "AI reviews assignments, coding exercises, and essays, giving detailed feedback.",
              link: "/ai-tutoring/feedback"
            }, {
              title: "AI Research Assistant",
              icon: <FaBookOpen size={40} className="text-yellow-500" />, 
              description: "AI helps summarize research papers and academic content.",
              link: "/ai-tutoring/research"
            }, {
              title: "AI-Powered Certification",
              icon: <FaCertificate size={40} className="text-yellow-500" />, 
              description: "Earn verified certificates with AI-driven assessment.",
              link: "/ai-tutoring/certifications"
            }].map((feature, index) => (
              <Link href={feature.link} key={index}>
                <motion.div whileHover={{ scale: 1.05 }} className="p-6 bg-gray-800 rounded-lg shadow-lg flex flex-col items-center text-center cursor-pointer hover:bg-gray-700 transition">
                  {feature.icon}
                  <h3 className="text-2xl font-bold mt-4">{feature.title}</h3>
                  <p className="text-gray-400 mt-2">{feature.description}</p>
                </motion.div>
              </Link>
            ))}
          </div>

          {/* Call-to-Action Button */}
          <motion.button whileHover={{ scale: 1.05 }} className="mt-12 px-8 py-4 bg-yellow-500 text-gray-900 font-semibold text-lg rounded-lg shadow-lg hover:bg-yellow-600 transition">
            🔥 Start Learning with AI Now
          </motion.button>

        </div>
      </section>
    </motion.section>
  );
};

export default AITutoring;