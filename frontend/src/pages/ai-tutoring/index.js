import Link from "next/link";
import { FaBrain, FaRobot, FaLightbulb, FaChalkboardTeacher, FaBookOpen, FaCog } from "react-icons/fa";

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
    <div className="min-h-screen bg-gray-900 text-white py-20 px-4">
      <div className="max-w-5xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-yellow-400 mb-4">Welcome to AI Tutoring Hub</h1>
        <p className="text-lg text-gray-300 mb-10 max-w-2xl mx-auto">
          Explore AI-enhanced learning tools built to make your journey smarter, faster, and more personalized.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tutoringSections.map((section, index) => {
            const Icon = section.icon;
            return (
              <div key={index} className="bg-gray-800 p-6 rounded-lg hover:bg-gray-700 transition border border-gray-700 hover:border-yellow-400">
                <Link href={section.link}>
                  <div className="flex flex-col items-center text-center cursor-pointer">
                    <Icon size={36} className="text-yellow-500 mb-3" />
                    <h3 className="text-xl font-semibold mb-1">{section.title}</h3>
                    <p className="text-gray-400 text-sm">{section.description}</p>
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
