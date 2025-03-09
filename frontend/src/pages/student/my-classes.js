import { useState } from "react";
import { useRouter } from "next/router";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";

// Dummy Data: Paid Classes for the Student
const dummyPaidClasses = [
  {
    id: 1,
    title: "Live React.js Bootcamp",
    instructor: "John Doe",
    date: "March 25, 2025",
    time: "10:00 AM - 12:00 PM",
    image: "/images/live/react-bootcamp.jpg",
    status: "upcoming", // "upcoming" | "completed"
  },
  {
    id: 2,
    title: "AI & Machine Learning Live Session",
    instructor: "Alice Smith",
    date: "April 5, 2025",
    time: "2:00 PM - 4:00 PM",
    image: "/images/live/ai-session.jpg",
    status: "completed",
  },
];

const MyLiveClasses = () => {
  const [myClasses, setMyClasses] = useState(dummyPaidClasses);
  const router = useRouter();

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <Navbar />
      <div className="container mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-yellow-400">🎓 My Live Classes</h1>

        {/* If no classes */}
        {myClasses.length === 0 ? (
          <p className="text-gray-300 mt-6 text-center">You have not enrolled in any live classes yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-6">
            {myClasses.map((liveClass) => (
              <div key={liveClass.id} className="bg-gray-800 p-4 rounded-lg shadow-md">
                <img
                  src={liveClass.image}
                  alt={liveClass.title}
                  className="w-full h-40 object-cover rounded-lg"
                />
                <h2 className="text-xl font-bold text-yellow-400 mt-3">{liveClass.title}</h2>
                <p className="text-gray-300">👨‍🏫 {liveClass.instructor}</p>
                <p className="text-yellow-500">📅 {liveClass.date} | 🕒 {liveClass.time}</p>

                {/* Join Button for Upcoming Classes */}
                {liveClass.status === "upcoming" && (
                  <button
                    className="bg-green-500 text-black px-4 py-2 rounded-lg hover:bg-green-600 transition mt-3 w-full font-semibold"
                    onClick={() => router.push(`/online-classes/${liveClass.id}`)}
                  >
                    🚀 Join Live Class
                  </button>
                )}

                {/* Completed Classes - View Recordings */}
                {liveClass.status === "completed" && (
                  <button
                    className="bg-blue-500 text-black px-4 py-2 rounded-lg hover:bg-blue-600 transition mt-3 w-full font-semibold"
                    onClick={() => router.push(`/recordings/${liveClass.id}`)}
                  >
                    🎥 View Recording
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default MyLiveClasses;
