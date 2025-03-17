import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import LiveChat from "@/components/online-classes/LiveChat";
import ParticipantsList from "@/components/online-classes/ParticipantsList";

// Dummy Data (Replace with API later)
const dummyLiveClasses = [
  {
    id: "1",
    title: "Live React.js Bootcamp",
    instructor: "John Doe",
    date: "March 25, 2025",
    time: "10:00 AM - 12:00 PM",
  },
  {
    id: "2",
    title: "AI & Machine Learning Live Session",
    instructor: "Alice Smith",
    date: "April 5, 2025",
    time: "2:00 PM - 4:00 PM",
  },
];

const LiveStreamPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [liveClass, setLiveClass] = useState(null);

  useEffect(() => {
    if (id) {
      const foundClass = dummyLiveClasses.find((c) => c.id === id);
      setLiveClass(foundClass || null);
    }
  }, [id]);

  if (!liveClass) {
    return (
      <div className="bg-gray-900 min-h-screen text-white flex items-center justify-center">
        <p className="text-2xl font-bold text-red-500">⚠️ Live Class Not Found</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <Navbar />

      <div className="container mx-auto px-6 py-8">
        {/* Class Info */}
        <h1 className="text-3xl font-bold text-yellow-400">{liveClass.title}</h1>
        <p className="text-gray-300">👨‍🏫 Instructor: {liveClass.instructor}</p>
        <p className="text-yellow-500">📅 {liveClass.date} | 🕒 {liveClass.time}</p>

        {/* Live Streaming Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {/* Video Player (Replace with real stream later) */}
          <div className="md:col-span-2">
            <div className="bg-black p-4 rounded-lg shadow-lg">
              <p className="text-center text-gray-500">🎥 Live Stream</p>
              <video
                controls
                autoPlay
                className="w-full rounded-lg"
                src="https://www.w3schools.com/html/mov_bbb.mp4"
              ></video>
            </div>
          </div>

          {/* Chat Section */}
          <div className="md:col-span-1 bg-gray-800 p-4 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold text-yellow-400">💬 Live Chat</h2>
            <LiveChat liveClassId={id} />
          </div>
        </div>

        {/* Participants List */}
        <div className="mt-6 bg-gray-800 p-4 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-yellow-400">👥 Participants</h2>
          <ParticipantsList liveClassId={id} />
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default LiveStreamPage;
