import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import Link from "next/link";

const dummyRecordings = [
  { id: 1, title: "React.js Bootcamp", date: "March 25, 2025" },
  { id: 2, title: "AI & Machine Learning", date: "April 5, 2025" },
];

const RecordingsPage = () => {
  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <Navbar />
      <div className="container mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-yellow-400">📼 Recorded Classes</h1>
        <ul className="mt-6">
          {dummyRecordings.map((rec) => (
            <li key={rec.id} className="mt-4">
              <Link href={`/recordings/${rec.id}`} className="text-blue-400 hover:underline">
                {rec.title} - {rec.date}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <Footer />
    </div>
  );
};
export default RecordingsPage;