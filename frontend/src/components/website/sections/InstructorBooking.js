import { useState } from "react";
import { motion } from "framer-motion";
import { FaSearch, FaChalkboardTeacher, FaStar, FaUserCheck, FaCalendarCheck } from "react-icons/fa";

// Sample instructor data
const instructors = [
  { id: 1, name: "Dr. John Doe", expertise: "Data Science", experience: "10+ Years", rating: 4.9 },
  { id: 2, name: "Jane Smith", expertise: "Web Development", experience: "8 Years", rating: 4.7 },
  { id: 3, name: "Prof. Mark Wilson", expertise: "AI & Machine Learning", experience: "12+ Years", rating: 4.8 },
  { id: 4, name: "Emily Davis", expertise: "Cybersecurity", experience: "7 Years", rating: 4.6 },
];

// List of available categories
const categories = ["All", "Data Science", "Web Development", "AI & ML", "Cybersecurity"];

const InstructorBooking = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [requestedInstructor, setRequestedInstructor] = useState(null);

  // Filter instructors based on category & search
  const filteredInstructors = instructors.filter(
    (instructor) =>
      (selectedCategory === "All" || instructor.expertise === selectedCategory) &&
      instructor.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (

    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      viewport={{ once: true }}
    >
      <section className="py-16 bg-gray-900 text-white text-center">
        <h2 className="text-4xl font-bold mb-6 text-yellow-500">Book a Private Lesson with an Instructor</h2>
        <p className="text-lg text-gray-300 mb-8">
          Browse expert instructors and request private lessons in your preferred subject.
        </p>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-8">
          {/* Search Input */}
          <div className="relative w-full max-w-lg">
            <input
              type="text"
              placeholder="Search instructors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-3 pl-10 rounded-lg border border-gray-500 focus:ring-2 focus:ring-yellow-500 focus:outline-none text-gray-900"
            />
            <FaSearch className="absolute left-3 top-4 text-gray-600 text-xl" />
          </div>

          {/* Category Dropdown */}
          <select
            className="p-3 border border-gray-500 rounded-lg bg-gray-800 text-white shadow-lg"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Instructor Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {filteredInstructors.map((instructor) => (
            <motion.div
              key={instructor.id}
              whileHover={{ scale: 1.05 }}
              className="p-6 bg-gray-800 rounded-lg shadow-lg text-center flex flex-col items-center hover:bg-yellow-500 transition"
            >
              <FaChalkboardTeacher className="text-yellow-500 text-4xl mb-3" />
              <h3 className="text-xl font-semibold">{instructor.name}</h3>
              <p className="text-gray-300 text-sm">{instructor.expertise}</p>
              <p className="text-gray-400 text-sm">{instructor.experience}</p>
              <div className="flex items-center gap-2 mt-2">
                <FaStar className="text-yellow-400" />
                <p className="text-gray-200">{instructor.rating} Rating</p>
              </div>

              {/* Request Lesson Button */}
              <button
                className="mt-4 bg-yellow-500 text-gray-900 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-yellow-600 transition"
                onClick={() => setRequestedInstructor(instructor.name)}
              >
                <FaUserCheck /> Request Lesson
              </button>
            </motion.div>
          ))}
        </div>

        {/* Booking Confirmation Modal */}
        {requestedInstructor && (
          <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-900 p-6 rounded-lg text-white shadow-xl max-w-lg text-center"
            >
              <h3 className="text-xl font-bold mb-4">Lesson Request Sent!</h3>
              <p className="text-gray-300">Your request has been sent to {requestedInstructor}. The instructor will review and respond shortly.</p>
              <button
                className="mt-4 bg-yellow-500 text-gray-900 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-yellow-600 transition"
                onClick={() => setRequestedInstructor(null)}
              >
                <FaCalendarCheck /> OK, Got It!
              </button>
            </motion.div>
          </div>
        )}
      </section>
    </motion.section>


  );
};

export default InstructorBooking;
