import { useState } from "react";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import QuestionCard from "@/components/community/QuestionCard";
import Filters from "@/components/community/Filters";
import Pagination from "@/components/community/Pagination";
import { useRouter } from "next/router";

const sampleQuestions = [
  { id: 1, title: "How to use useEffect?", description: "Understanding useEffect.", tags: ["React", "Hooks"], votes: 12, views: 120, answers: [{ text: "Use useEffect for API calls!" }], user: { name: "John Doe", reputation: 320 }, date: "2024-02-20" },
  { id: 2, title: "Best practices for indexing?", description: "Indexing strategies?", tags: ["Database", "MySQL"], votes: 20, views: 90, answers: [], user: { name: "Emma Wilson", reputation: 210 }, date: "2024-02-18" },
];

const CommunityPage = () => {
  const [filteredQuestions, setFilteredQuestions] = useState(sampleQuestions);
  const router = useRouter();

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <Navbar />
      <div className="container mx-auto px-6 py-10">
        <h1 className="text-4xl font-bold text-yellow-500">🗣️ Community Forum</h1>
        <Filters onFilterChange={() => {}} />

        <div className="mt-6">
          {filteredQuestions.map(q => <QuestionCard key={q.id} question={q} />)}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CommunityPage;
