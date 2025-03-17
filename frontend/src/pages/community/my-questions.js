
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import Link from "next/link";

const dummyQuestions = [
  { id: 1, title: "How to use React useEffect hook?", date: "March 20, 2025" },
  { id: 2, title: "What is the best way to learn AI?", date: "March 22, 2025" },
];

const MyQuestions = () => {
  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <Navbar />
      <div className="container mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-yellow-400">❓ My Questions</h1>
        <ul className="mt-6">
          {dummyQuestions.map((q) => (
            <li key={q.id} className="mt-4">
              <Link href={`/community/question/${q.id}`} className="text-blue-400 hover:underline">
                {q.title} - {q.date}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <Footer />
    </div>
  );
};
export default MyQuestions;