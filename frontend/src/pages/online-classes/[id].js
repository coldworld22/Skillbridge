import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import LiveClassDetails from "@/components/online-classes/LiveClassDetails";

// Dummy Data (Replace this with API call in the future)
const dummyLiveClasses = [
  {
    id: 1,
    title: "Live React.js Bootcamp",
    instructor: "John Doe",
    date: "March 25, 2025",
    time: "10:00 AM - 12:00 PM",
    description: "Join us for a hands-on React.js bootcamp!",
    resources: [
      { name: "React Cheat Sheet", url: "/files/react-cheat-sheet.pdf" },
      { name: "Class Slides", url: "/files/react-slides.pdf" },
    ],
  },
  {
    id: 2,
    title: "AI & Machine Learning Live Session",
    instructor: "Alice Smith",
    date: "April 5, 2025",
    time: "2:00 PM - 4:00 PM",
    description: "Explore AI & ML with top experts!",
    resources: [
      { name: "AI Research Paper", url: "/files/ai-research.pdf" },
      { name: "Machine Learning Basics", url: "/files/ml-basics.pdf" },
    ],
  },
];

const LiveClassPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [liveClass, setLiveClass] = useState(null);

  // Simulating fetching data (Replace with API call)
  useEffect(() => {
    if (id) {
      const foundClass = dummyLiveClasses.find((c) => c.id === parseInt(id));
      setLiveClass(foundClass || null);
    }
  }, [id]);

  if (!liveClass) {
    return (
      <div className="bg-gray-900 min-h-screen text-white">
        <Navbar />
        <div className="container mx-auto px-6 py-20 text-center">
          <h1 className="text-3xl font-bold text-red-500">Class Not Found</h1>
          <button
            onClick={() => router.push("/online-classes")}
            className="mt-4 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            Go Back to Classes
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <Navbar />
      <LiveClassDetails liveClass={liveClass} />
      <Footer />
    </div>
  );
};

export default LiveClassPage;
