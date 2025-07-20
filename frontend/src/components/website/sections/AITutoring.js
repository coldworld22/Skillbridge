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
import { useTranslation } from "next-i18next";

const AITutoring = () => {
  const { t } = useTranslation("website");

  const features = [
    {
      title: t("ai_feature_adaptive_title"),
      icon: FaBrain,
      description: t("ai_feature_adaptive_description"),
      link: "/ai-tutoring/lesson-planner",
    },
    {
      title: t("ai_feature_quizzes_title"),
      icon: FaLightbulb,
      description: t("ai_feature_quizzes_description"),
      link: "/ai-tutoring/practice",
    },
    {
      title: t("ai_feature_chat_title"),
      icon: FaRobot,
      description: t("ai_feature_chat_description"),
      link: "/ai-tutoring/chat",
    },
    {
      title: t("ai_feature_feedback_title"),
      icon: FaChalkboardTeacher,
      description: t("ai_feature_feedback_description"),
      link: "/ai-tutoring/feedback",
    },
    {
      title: t("ai_feature_research_title"),
      icon: FaBookOpen,
      description: t("ai_feature_research_description"),
      link: "/ai-tutoring/research",
    },
    {
      title: t("ai_feature_transcript_title"),
      icon: FaBookOpen,
      description: t("ai_feature_transcript_description"),
      link: "/ai-tutoring/transcript",
    },
  ];

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
            {t("ai_heading")}
          </motion.h2>
          <p className="text-lg md:text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
            {t("ai_description")}
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
              {t("ai_start_learning")}
            </motion.div>
          </Link>


          <p className="mt-4 text-sm text-gray-400">{t("ai_join_text")}</p>
        </div>
      </section>
    </motion.section>
  );
};

export default AITutoring;
