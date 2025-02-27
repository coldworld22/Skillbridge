import { useState } from "react";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import QuestionCard from "@/components/community/QuestionCard";
import Filters from "@/components/community/Filters";
import Pagination from "@/components/community/Pagination";
import { FaPlus } from "react-icons/fa";
import Link from "next/link";

// Sample Questions Data
const sampleQuestions = [
  {
    id: 1,
    title: "How to use useEffect in React?",
    description: "I'm struggling to understand the use cases for useEffect.",
    tags: ["React", "Hooks"],
    votes: 12,
    answers: [{ text: "Use useEffect for API calls!" }],
    views: 150,
    user: { name: "John Doe", reputation: 320 },
    date: "2 days ago",
  },
  {
    id: 2,
    title: "Best practices for database indexing?",
    description: "What are the best indexing strategies for MySQL?",
    tags: ["Database", "MySQL"],
    votes: 8,
    answers: [],
    views: 90,
    user: { name: "Emma Wilson", reputation: 210 },
    date: "5 days ago",
  },
];

const CommunityPage = () => {
  const [filteredQuestions, setFilteredQuestions] = useState(sampleQuestions);
  const [currentPage, setCurrentPage] = useState(1);
  const questionsPerPage = 3;
  const totalPages = Math.ceil(filteredQuestions.length / questionsPerPage);

  // Handle Filter Change
  const handleFilterChange = (filter) => {
    let updatedQuestions = [...sampleQuestions];

    if (filter.noAnswers) {
      updatedQuestions = updatedQuestions.filter((q) => q.answers.length === 0);
    }

    if (filter.sortBy === "Newest") {
      updatedQuestions.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (filter.sortBy === "Highest Score") {
      updatedQuestions.sort((a, b) => b.votes - a.votes);
    }

    setFilteredQuestions(updatedQuestions);
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Slice questions for pagination
  const indexOfLastQuestion = currentPage * questionsPerPage;
  const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage;
  const currentQuestions = filteredQuestions.slice(indexOfFirstQuestion, indexOfLastQuestion);

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <Navbar />

      {/* ✅ Community Header */}
      <div className="container mx-auto px-6 py-10 text-center">
        <h1 className="text-4xl font-bold text-yellow-500">🗣️ Community Forum</h1>

        {/* ✅ Ask Question Button */}
        <Link href="/community/ask">
          <button className="mt-6 px-6 py-3 bg-yellow-500 text-gray-900 font-bold rounded-lg hover:bg-yellow-600 flex items-center gap-2">
            <FaPlus /> Ask a Question
          </button>
        </Link>
      </div>

      {/* ✅ Filters & Questions */}
      <div className="container mx-auto px-6 py-8">
        <Filters onFilterChange={handleFilterChange} />

        {/* ✅ Questions List */}
        <div className="mt-6 space-y-6">
          {currentQuestions.length > 0 ? (
            currentQuestions.map((question) => <QuestionCard key={question.id} question={question} />)
          ) : (
            <p className="text-gray-400">No questions found.</p>
          )}
        </div>

        {/* ✅ Pagination */}
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      <Footer />
    </div>
  );
};

export default CommunityPage;
