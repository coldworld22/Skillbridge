import Link from "next/link";
import { useState, useEffect } from "react";

const dummyLiveClasses = [
  {
    id: 1,
    title: "Live React.js Bootcamp",
    instructor: "John Doe",
    date: "March 25, 2025",
    time: "10:00 AM - 12:00 PM",
    price: 20, // 💰 Price for the class
    image: "/images/live/react-bootcamp.jpg",
  },
  {
    id: 2,
    title: "AI & Machine Learning Live Session",
    instructor: "Alice Smith",
    date: "April 5, 2025",
    time: "2:00 PM - 4:00 PM",
    price: 30, // 💰 Price for the class
    image: "/images/live/ai-session.jpg",
  },
];

const LiveClassList = () => {
  const [liveClasses, setLiveClasses] = useState([]);

  useEffect(() => {
    setLiveClasses(dummyLiveClasses); // Load classes (replace with API later)
  }, []);

  return (
    <div className="container mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold text-yellow-400">📅 Upcoming Live Classes</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {liveClasses.map((liveClass) => (
          <div key={liveClass.id} className="bg-gray-800 p-4 rounded-lg shadow-lg">
            <img src={liveClass.image} alt={liveClass.title} className="w-full h-40 object-cover rounded-md" />
            <h2 className="text-xl font-bold text-yellow-400 mt-4">{liveClass.title}</h2>
            <p className="text-gray-300">{liveClass.instructor}</p>
            <p className="text-yellow-500">📅 {liveClass.date} | 🕒 {liveClass.time}</p>
            <p className="text-green-400 font-bold">💰 ${liveClass.price}</p>

            <div className="flex justify-between mt-4">
              <Link href={`/online-classes/${liveClass.id}`}>
                <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition">
                  📺 View Class
                </button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveClassList;
