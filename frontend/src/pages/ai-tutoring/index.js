import Link from "next/link";
import { FaBrain, FaRobot, FaLightbulb, FaChalkboardTeacher, FaBookOpen, FaCog } from "react-icons/fa";
import styles from "./ai.module.scss";

const tutoringSections = [
  {
    title: "Lesson Planner",
    description: "Define your learning goals and let AI build a custom study path.",
    icon: FaBrain,
    link: "/ai-tutoring/lesson-planner"
  },
  {
    title: "Practice Quizzes",
    description: "Test your knowledge with dynamic AI-generated quizzes.",
    icon: FaLightbulb,
    link: "/ai-tutoring/practice"
  },
  {
    title: "AI Chat Tutor",
    description: "Ask anything to your always-available AI tutor.",
    icon: FaRobot,
    link: "/ai-tutoring/chat"
  },
  {
    title: "Instant Feedback",
    description: "Upload assignments and get smart AI insights instantly.",
    icon: FaChalkboardTeacher,
    link: "/ai-tutoring/feedback"
  },
  {
    title: "Research Assistant",
    description: "Let AI summarize or explain research papers for you.",
    icon: FaBookOpen,
    link: "/ai-tutoring/research"
  },
  {
    title: "AI Transcript",
    description: "View a personalized log of your AI interactions, learning goals, and study preferences.",
    icon: FaBookOpen,
    link: "/ai-tutoring/transcript"
  }

];

export default function AITutoringIndex() {
  return (
    <div className={styles.page}>
      <div className={`${styles.container} ${styles.narrow}`} style={{ textAlign: "center" }}>
        <h1 className={styles.title}>Welcome to AI Tutoring Hub</h1>
        <p className={styles.subtitle}>
          Explore AI-enhanced learning tools built to make your journey smarter, faster, and more personalized.
        </p>
        <div className={`${styles.grid} ${styles.gridThree}`} style={{ marginTop: "2rem" }}>
          {tutoringSections.map((section, index) => {
            const Icon = section.icon;
            return (
              <div key={index} className={styles.card} style={{ textAlign: "center", cursor: "pointer" }}>
                <Link href={section.link}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <Icon size={36} color="#fbbf24" style={{ marginBottom: "0.6rem" }} />
                    <h3 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "0.35rem" }}>{section.title}</h3>
                    <p className={styles.muted}>{section.description}</p>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
