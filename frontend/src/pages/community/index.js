import { useState, useEffect } from "react";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import QuestionCard from "@/components/community/QuestionCard";
import Filters from "@/components/community/Filters";
import Pagination from "@/components/community/Pagination";
import { FaPlus } from "react-icons/fa";
import Link from "next/link";
import { fetchDiscussions } from "@/services/communityService";


const CommunityPage = () => {
  const [allQuestions, setAllQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const questionsPerPage = 3;
  const totalPages = Math.ceil(filteredQuestions.length / questionsPerPage);

  useEffect(() => {
    const load = async () => {
      const list = await fetchDiscussions();
      const normalized = list.map((q) => ({
        ...q,
        description: q.description || q.content || "",
        tags: Array.isArray(q.tags)
          ? q.tags
          : typeof q.tags === "string" && q.tags
          ? JSON.parse(q.tags)
          : [],
        answers: Array.isArray(q.answers) ? q.answers : [],
        date: q.date || q.created_at,
        user: q.user ? q.user : { name: q.user_name },
      }));
      setAllQuestions(normalized);
      setFilteredQuestions(normalized);
    };
    load();
  }, []);

  // Handle Filter Change
  const handleFilterChange = (filter) => {
    let updatedQuestions = [...allQuestions];

    if (filter.noAnswers) {
      updatedQuestions = updatedQuestions.filter(
        (q) => (q.answers?.length ?? 0) === 0
      );
    }

    if (filter.noAcceptedAnswer) {
      updatedQuestions = updatedQuestions.filter((q) => !q.resolved);
    }

    if (filter.hasBounty) {
      updatedQuestions = updatedQuestions.filter(
        (q) => Number(q.bounty || q.bounty_amount || 0) > 0
      );
    }

    if (filter.tags && filter.tags.length) {
      const tagsArray = Array.isArray(filter.tags)
        ? filter.tags
        : filter.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);
      if (tagsArray.length) {
        updatedQuestions = updatedQuestions.filter((q) => {
          const qTags = Array.isArray(q.tags) ? q.tags.map((t) => t.toLowerCase()) : [];
          return tagsArray.every((tag) => qTags.includes(tag.toLowerCase()));
        });
      }
    }

    if (filter.sortBy === "Newest") {
      updatedQuestions.sort(
        (a, b) => new Date(b.date || 0) - new Date(a.date || 0)
      );
    } else if (filter.sortBy === "Highest Score") {
      updatedQuestions.sort((a, b) => (b.votes || 0) - (a.votes || 0));
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

import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../next-i18next.config.js';

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'], nextI18NextConfig)),
    },
  };
}
