import { useRouter } from "next/router";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";

const dummyQuestions = {
  1: { title: "How to use React useEffect hook?", details: "Can someone explain how useEffect works?" },
  2: { title: "What is the best way to learn AI?", details: "I want to start learning AI. Any recommendations?" },
};

const QuestionDetails = () => {
  const router = useRouter();
  const { id } = router.query;
  const question = dummyQuestions[id] || null;

  if (!question) return <p className="text-center text-white">Question not found.</p>;

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <Navbar />
      <div className="container mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-yellow-400">❓ {question.title}</h1>
        <p className="text-gray-300 mt-4">{question.details}</p>
      </div>
      <Footer />
    </div>
  );
};
export default QuestionDetails;