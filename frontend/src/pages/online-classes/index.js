import { useState } from "react";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import LiveClassCard from "@/components/online-classes/LiveClassCard";
import { useRouter } from "next/router";

const dummyLiveClasses = [
  {
    id: 1,
    title: "Live React.js Bootcamp",
    instructor: "John Doe",
    date: "March 25, 2025",
    time: "10:00 AM - 12:00 PM",
    price: "$20",
    image: "/images/live/react-bootcamp.jpg",
  },
  {
    id: 2,
    title: "AI & Machine Learning Live Session",
    instructor: "Alice Smith",
    date: "April 5, 2025",
    time: "2:00 PM - 4:00 PM",
    price: "$25",
    image: "/images/live/ai-session.jpg",
  },
];

const OnlineClasses = () => {
  const [liveClasses, setLiveClasses] = useState(dummyLiveClasses);
  const router = useRouter();

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <Navbar />
      <div className="container mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-yellow-400">📅 Upcoming Live Classes</h1>

        {/* 🔍 Live Class Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {liveClasses.map((liveClass) => (
            <div
              key={liveClass.id}
              onClick={() => router.push(`/online-classes/${liveClass.id}`)}
              className="cursor-pointer"
            >
              <LiveClassCard liveClass={liveClass} />
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default OnlineClasses;
