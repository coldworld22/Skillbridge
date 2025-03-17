import Link from "next/link";

export default function AITutoringOverview() {
  return (
    <div className="p-10 text-center bg-gray-900 text-white min-h-screen">
      <h1 className="text-5xl font-extrabold">🚀 AI Tutoring</h1>
      <p className="mt-4 text-lg text-gray-300">Experience personalized, AI-driven learning to enhance your knowledge and skills.</p>
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 justify-center">
        <Link href="/ai-tutoring/chat" className="block p-6 bg-gray-800 rounded-lg shadow-lg hover:bg-gray-700 transition">
          <h2 className="text-xl font-semibold">💬 AI Chat Tutor</h2>
          <p className="text-gray-400 mt-2">Get instant answers from AI-powered tutors.</p>
        </Link>
        <Link href="/ai-tutoring/lesson-planner" className="block p-6 bg-gray-800 rounded-lg shadow-lg hover:bg-gray-700 transition">
          <h2 className="text-xl font-semibold">📖 Lesson Planner</h2>
          <p className="text-gray-400 mt-2">Personalized study plans based on your progress.</p>
        </Link>
        <Link href="/ai-tutoring/practice" className="block p-6 bg-gray-800 rounded-lg shadow-lg hover:bg-gray-700 transition">
          <h2 className="text-xl font-semibold">📝 Quizzes & Exercises</h2>
          <p className="text-gray-400 mt-2">Practice with AI-generated quizzes.</p>
        </Link>
        <Link href="/ai-tutoring/feedback" className="block p-6 bg-gray-800 rounded-lg shadow-lg hover:bg-gray-700 transition">
          <h2 className="text-xl font-semibold">🔍 AI Feedback</h2>
          <p className="text-gray-400 mt-2">Get AI-powered feedback on your work.</p>
        </Link>
        <Link href="/ai-tutoring/voice" className="block p-6 bg-gray-800 rounded-lg shadow-lg hover:bg-gray-700 transition">
          <h2 className="text-xl font-semibold">🎙️ AI Voice Tutor</h2>
          <p className="text-gray-400 mt-2">Interact with AI through voice commands.</p>
        </Link>
        <Link href="/ai-tutoring/research" className="block p-6 bg-gray-800 rounded-lg shadow-lg hover:bg-gray-700 transition">
          <h2 className="text-xl font-semibold">📚 Research Assistant</h2>
          <p className="text-gray-400 mt-2">Summarize research papers and academic content.</p>
        </Link>
        <Link href="/ai-tutoring/certifications" className="block p-6 bg-gray-800 rounded-lg shadow-lg hover:bg-gray-700 transition">
          <h2 className="text-xl font-semibold">🏆 AI Certifications</h2>
          <p className="text-gray-400 mt-2">Earn verified AI-powered certifications.</p>
        </Link>
      </div>
    </div>
  );
}