import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import { FaArrowUp, FaArrowDown, FaComment } from "react-icons/fa";
import { useRouter } from "next/router";

const QuestionDetails = () => {
  const router = useRouter();

  // Static sample question for UI simulation
  const question = {
    title: "How to use useEffect in React?",
    description: "I’m struggling to understand the use cases for useEffect.",
    tags: ["React", "Hooks"],
    votes: 12,
    views: 150,
    answers: [
      { text: "Use useEffect for API calls and subscriptions." },
      { text: "Always clean up side effects in useEffect return function." },
    ],
    user: { name: "John Doe", reputation: 320 },
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <Navbar />
      <div className="container mx-auto px-6 py-10">
        {/* Question Title */}
        <h1 className="text-4xl font-bold text-yellow-500">{question.title}</h1>
        <p className="text-gray-300 mt-2">{question.description}</p>

        {/* Tags */}
        <div className="flex gap-2 mt-4">
          {question.tags.map((tag, index) => (
            <span key={index} className="bg-yellow-600 px-3 py-1 rounded text-sm text-white">{tag}</span>
          ))}
        </div>

        {/* Votes and Views */}
        <div className="flex justify-between items-center mt-6 bg-gray-800 p-4 rounded-lg">
          <div className="flex items-center gap-4">
            <button className="text-gray-400 hover:text-yellow-500"><FaArrowUp /></button>
            <span className="text-yellow-400 font-bold">{question.votes ?? 0}</span>
            <button className="text-gray-400 hover:text-yellow-500"><FaArrowDown /></button>
          </div>
          <span className="text-gray-400">{question.views} views</span>
        </div>

        {/* Answers Section */}
        <div className="mt-8">
          <h3 className="text-2xl font-bold text-yellow-500">💬 Answers</h3>
          {question.answers.length > 0 ? (
            question.answers.map((answer, index) => (
              <div key={index} className="bg-gray-800 p-4 rounded-lg mt-4">
                <p className="text-gray-300">{answer.text}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-400 mt-4">No answers yet. Be the first to answer!</p>
          )}
        </div>

        {/* Leave an Answer */}
        <div className="mt-8">
          <h3 className="text-2xl font-bold text-yellow-500">📝 Your Answer</h3>
          <textarea className="w-full bg-gray-800 text-white p-4 rounded-lg mt-2" rows="4" placeholder="Write your answer here..."></textarea>
          <button className="mt-4 px-6 py-3 bg-yellow-500 text-gray-900 font-bold rounded-lg hover:bg-yellow-600 transition">
            Submit Answer
          </button>
        </div>

        {/* Back Button */}
        <button 
          onClick={() => router.push("/community")}
          className="mt-6 px-6 py-3 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600"
        >
          🔙 Back to Questions
        </button>
      </div>
      <Footer />
    </div>
  );
};

export default QuestionDetails;
