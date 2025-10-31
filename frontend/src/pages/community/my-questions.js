import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import Link from "next/link";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../next-i18next.config.js";

const dummyQuestions = [
  { id: 1, title: "How to use React useEffect hook?", date: "March 20, 2025" },
  { id: 2, title: "What is the best way to learn AI?", date: "March 22, 2025" },
];

const MyQuestions = () => {
  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <Navbar />
      <div className="container mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-yellow-400">My Questions</h1>
        <p className="mt-2 text-gray-300">
          Review your recent activity and jump back into conversations you started.
        </p>
        <ul className="mt-8 space-y-4">
          {dummyQuestions.map((q) => (
            <li key={q.id}>
              <Link
                href={`/community/question/${q.id}`}
                className="block rounded-xl border border-gray-800 bg-gray-900 px-5 py-4 transition hover:border-yellow-400/60 hover:bg-gray-800"
              >
                <h2 className="text-lg font-semibold text-white">{q.title}</h2>
                <p className="mt-1 text-sm text-gray-400">Asked on {q.date}</p>
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

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"], nextI18NextConfig)),
    },
  };
}
