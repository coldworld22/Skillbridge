import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  FaBrain,
  FaRobot,
  FaChalkboardTeacher,
  FaLightbulb,
  FaChartLine,
  FaClipboardCheck,
} from "react-icons/fa";
import aiIllustration from "@/shared/assets/images/home/ai-tutor.png";
import { useTranslation } from "next-i18next";

const FEATURES = [
  {
    key: "adaptive",
    icon: FaBrain,
    link: "/ai-tutoring/lesson-planner",
    titleKey: "ai_feature_adaptive_title",
    descriptionKey: "ai_feature_adaptive_description",
  },
  {
    key: "practice",
    icon: FaLightbulb,
    link: "/ai-tutoring/practice",
    titleKey: "ai_feature_quizzes_title",
    descriptionKey: "ai_feature_quizzes_description",
  },
  {
    key: "chat",
    icon: FaRobot,
    link: "/ai-tutoring/chat",
    titleKey: "ai_feature_chat_title",
    descriptionKey: "ai_feature_chat_description",
  },
  {
    key: "feedback",
    icon: FaChalkboardTeacher,
    link: "/ai-tutoring/feedback",
    titleKey: "ai_feature_feedback_title",
    descriptionKey: "ai_feature_feedback_description",
  },
  {
    key: "research",
    icon: FaChartLine,
    link: "/ai-tutoring/research",
    titleKey: "ai_feature_research_title",
    descriptionKey: "ai_feature_research_description",
  },
  {
    key: "transcript",
    icon: FaClipboardCheck,
    link: "/ai-tutoring/transcript",
    titleKey: "ai_feature_transcript_title",
    descriptionKey: "ai_feature_transcript_description",
  },
];

const getTranslation = (t, key, fallback) =>
  typeof t === "function" ? t(key, fallback) : fallback;

const AITutoring = () => {
  const { t } = useTranslation("website");

  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      viewport={{ once: true }}
      className="relative w-full overflow-hidden bg-gray-950"
    >
      <div className="absolute inset-0">
        <Image
          src={aiIllustration}
          alt=""
          fill
          priority
          placeholder="blur"
          sizes="100vw"
          className="object-cover opacity-70 mix-blend-screen"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-950/95 via-65% to-yellow-900/40" />
      <section className="relative z-10 mx-auto flex max-w-6xl flex-col gap-16 px-6 py-24 text-white md:px-8 lg:px-12">
        <div className="flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-yellow-400/60 bg-yellow-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-yellow-300">
            {getTranslation(t, "ai_badge", "SkillBridge AI Suite")}
          </span>
          <h2 className="mt-6 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
            {getTranslation(
              t,
              "ai_heading",
              "AI-Powered Tutoring for Smarter Learning"
            )}
          </h2>
          <p className="mt-4 max-w-3xl text-base text-gray-200 sm:text-lg">
            {getTranslation(
              t,
              "ai_description",
              "Harness intelligent study plans, instant feedback, and guided practice from our AI mentors."
            )}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-gray-300">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
              <FaRobot className="text-yellow-400" />
              {getTranslation(t, "ai_highlight_personalized", "Personalized tutoring in seconds")}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
              <FaLightbulb className="text-yellow-400" />
              {getTranslation(t, "ai_highlight_support", "24/7 learning companion")}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            const title = getTranslation(t, feature.titleKey, feature.link);
            const description = getTranslation(
              t,
              feature.descriptionKey,
              ""
            );
            return (
              <Link
                href={feature.link}
                key={feature.key}
                aria-label={`Go to ${title}`}
              >
                <motion.div
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="group h-full rounded-2xl border border-white/5 bg-white/5 p-6 shadow-lg backdrop-blur-sm transition hover:border-yellow-400/50 hover:bg-yellow-400/10"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-400/20 text-yellow-300 group-hover:bg-yellow-400/40">
                    <Icon size={26} aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-white">{title}</h3>
                  <p className="mt-3 text-sm text-gray-200/90">{description}</p>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-yellow-300 transition group-hover:translate-x-1">
                    {getTranslation(t, "ai_feature_cta", "Explore tool")}
                    <span aria-hidden="true">→</span>
                  </span>
                </motion.div>
              </Link>
            );
          })}
        </div>

        <div className="flex flex-col items-center justify-center gap-4 text-center md:flex-row md:gap-6">
          <Link
            href="/ai-tutoring"
            className="inline-flex items-center justify-center rounded-full bg-yellow-400 px-8 py-3 text-base font-semibold text-gray-900 shadow-lg transition hover:bg-yellow-300"
            aria-label="Start AI learning now"
          >
            <motion.span
              whileHover={{ scale: 1.03 }}
              animate={{
                scale: [1, 1.02, 1],
                transition: { repeat: Infinity, duration: 2 },
              }}
            >
              {t("ai_start_learning")}
            </motion.span>
          </Link>
          <Link
            href="/ai-tutoring/chat"
            className="inline-flex items-center justify-center rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:border-yellow-300 hover:text-yellow-200"
          >
            {getTranslation(t, "ai_secondary_cta", "Try the AI chat assistant")}
          </Link>
        </div>

        <p className="text-sm text-gray-300">
          {getTranslation(
            t,
            "ai_join_text",
            "Join thousands of learners already using SkillBridge AI."
          )}
        </p>
      </section>
    </motion.section>
  );
};

export default AITutoring;
