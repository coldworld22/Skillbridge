import { useState } from "react";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import { useRouter } from "next/router";
import { motion } from "framer-motion";

// Dummy Data - Instructor's Classes
const dummyInstructorClasses = [
  {
    id: 1,
    title: "Live React.js Bootcamp",
    date: "March 25, 2025",
    time: "10:00 AM - 12:00 PM",
    students: 15,
    price: 20,
    image: "/images/live/react-bootcamp.jpg",
  },
  {
    id: 2,
    title: "AI & Machine Learning Live Session",
    date: "April 5, 2025",
    time: "2:00 PM - 4:00 PM",
    students: 12,
    price: 30,
    image: "/images/live/ai-session.jpg",
  },
];

const ManageClasses = () => {
  const [instructorClasses, setInstructorClasses] = useState(dummyInstructorClasses);
  const router = useRouter();

  const handleStartClass = (id) => {
    router.push(`/online-classes/${classId}`); // ✅ Now consistent

  };

  const handleEditClass = (id) => {
    alert("Edit class feature coming soon!");
  };

  const handleCancelClass = (id) => {
    if (confirm("Are you sure you want to cancel this class?")) {
      setInstructorClasses(instructorClasses.filter((cls) => cls.id !== id));
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <Navbar />
      <div className="container mx-auto px-6 py-12">
        <motion.div
          className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-3xl mx-auto"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-yellow-400">🎓 Manage My Classes</h1>
          <p className="text-gray-300 mt-2">View and control your scheduled live classes.</p>

          {instructorClasses.length === 0 ? (
            <p className="text-gray-400 mt-4">You have no scheduled classes.</p>
          ) : (
            <div className="mt-6 space-y-6">
              {instructorClasses.map((cls) => (
                <div key={cls.id} className="flex gap-4 bg-gray-700 p-4 rounded-lg shadow-md">
                  <img src={cls.image} alt={cls.title} className="w-28 h-28 rounded-lg shadow" />
                  <div className="flex-grow">
                    <h2 className="text-xl font-semibold text-yellow-400">{cls.title}</h2>
                    <p className="text-gray-400">📅 {cls.date} | 🕒 {cls.time}</p>
                    <p className="text-gray-400">👥 {cls.students} students enrolled</p>
                    <p className="text-yellow-500">💲 Price: ${cls.price}</p>

                    {/* Class Actions */}
                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => handleStartClass(cls.id)}
                        className="bg-green-500 text-black px-4 py-2 rounded-lg hover:bg-green-400 transition font-bold"
                      >
                        Start Class
                      </button>
                      <button
                        onClick={() => handleEditClass(cls.id)}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-400 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleCancelClass(cls.id)}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-400 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default ManageClasses;
