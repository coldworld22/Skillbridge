import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  FaBrain,
  FaRobot,
  FaChalkboardTeacher,
  FaLightbulb,
  FaBookOpen,
  FaCog,
} from "react-icons/fa";
import aiIllustration from "@/shared/assets/images/home/ai-tutor.png";

const features = [
  {
    title: "Adaptive Learning Paths",
    icon: FaBrain,
    description:
      "AI analyzes your strengths & weaknesses to create a customized learning roadmap.",
    link: "/ai-tutoring/lesson-planner",
  },
  {
    title: "AI-Generated Quizzes",
    icon: FaLightbulb,
    description:
      "Practice with AI-generated quizzes based on your learning progress.",
    link: "/ai-tutoring/practice",
  },
  {
    title: "24/7 AI Chat Tutor",
    icon: FaRobot,
    description:
      "Ask AI-powered tutors any question and receive instant, real-time answers.",
    link: "/ai-tutoring/chat",
  },
  {
    title: "Real-Time Feedback",
    icon: FaChalkboardTeacher,
    description:
      "AI reviews assignments, coding exercises, and essays, giving detailed feedback.",
    link: "/ai-tutoring/feedback",
  },
  {
    title: "AI Research Assistant",
    icon: FaBookOpen,
    description: "AI helps summarize research papers and academic content.",
    link: "/ai-tutoring/research",
  },
  {
    title: "AI Transcript",
    description: "View a personalized log of your AI interactions, learning goals, and study preferences.",
    icon: FaBookOpen,
    link: "/ai-tutoring/transcript"
  }
];

const AITutoring = () => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      viewport={{ once: true }}
    >
      <section className="relative w-full py-24 bg-gray-900 text-white text-center overflow-hidden">
        <div
          className="absolute inset-0 opacity-10 bg-cover bg-center"
          style={{ backgroundImage: `url(${aiIllustration.src})` }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/80 to-gray-900/90 z-0"></div>

        <div className="relative z-10 max-w-6xl mx-auto px-8">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-5xl font-extrabold mb-6 text-yellow-400"
          >
            🚀 AI-Powered Tutoring for Smarter Learning
          </motion.h2>
          <p className="text-lg md:text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
            Experience <strong>personalized, AI-driven learning</strong> with real-time
            feedback, intelligent quiz generation, and adaptive study plans tailored to
            your progress.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Link href={feature.link} key={index} aria-label={`Go to ${feature.title}`}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="p-6 bg-gray-800 rounded-lg shadow-lg flex flex-col items-center text-center cursor-pointer hover:bg-gray-700 transition hover:ring-2 hover:ring-yellow-500"
                    role="group"
                    aria-labelledby={`feature-${index}`}
                  >
                    <Icon size={40} className="text-yellow-500" aria-hidden="true" />
                    <h3 id={`feature-${index}`} className="text-2xl font-bold mt-4">
                      {feature.title}
                    </h3>
                    <p className="text-gray-400 mt-2">{feature.description}</p>
                  </motion.div>
                </Link>
              );
            })}
          </div>

          {/* ✅ Fixed Hydration-safe CTA */}
          <Link
            href="/ai-tutoring/"
            className="inline-block mt-12 px-8 py-4 bg-yellow-500 text-gray-900 font-semibold text-lg rounded-lg shadow-lg hover:bg-yellow-600 transition"
            aria-label="Start AI learning now"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              animate={{
                scale: [1, 1.03, 1],
                transition: { repeat: Infinity, duration: 1.5 },
              }}
            >
              🔥 Start Learning with AI Now
            </motion.div>
          </Link>


          <p className="mt-4 text-sm text-gray-400">
            Join over <strong>50,000 learners</strong> already leveling up with AI 💡
          </p>
        </div>
      </section>
    </motion.section>
  );
};

export default AITutoring;
