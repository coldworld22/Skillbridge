import React from "react";
import { motion } from "framer-motion";
import { FaLinkedin, FaTwitter, FaGlobe } from "react-icons/fa";
import ClassCard from "@/components/classes/ClassCard";

const InstructorProfile = ({ instructor, courses }) => {
  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg mt-10">
      {/* Instructor Header */}
      <motion.div 
        className="flex items-center gap-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* Profile Image */}
        <motion.img
          src={instructor.image}
          alt={instructor.name}
          className="w-20 h-20 rounded-full border-4 border-yellow-500 shadow-lg"
          whileHover={{ scale: 1.1 }}
        />

        {/* Instructor Info */}
        <div>
          <h2 className="text-2xl font-bold text-yellow-400">{instructor.name}</h2>
          <p className="text-gray-300 text-sm">{instructor.bio}</p>
          <div className="flex gap-3 mt-2">
            {instructor.linkedin && (
              <a href={instructor.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition">
                <FaLinkedin size={20} />
              </a>
            )}
            {instructor.twitter && (
              <a href={instructor.twitter} target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-blue-200 transition">
                <FaTwitter size={20} />
              </a>
            )}
            {instructor.website && (
              <a href={instructor.website} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-300 transition">
                <FaGlobe size={20} />
              </a>
            )}
          </div>
        </div>
      </motion.div>

      {/* Divider */}
      <hr className="border-t-2 border-gray-700 mt-6" />

      {/* Instructor’s Other Courses */}
      <motion.div 
        className="mt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.8 }}
      >
        <h3 className="text-xl font-semibold text-yellow-400 mb-4">More Courses by {instructor.name}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {courses.length > 0 ? (
            courses.map((course) => <ClassCard key={course.id} course={course} />)
          ) : (
            <p className="text-gray-400">No other courses found.</p>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// Mock Data for Testing
const instructorMock = {
  name: "John Doe",
  bio: "Expert in React.js and Full-Stack Development with 10+ years of experience.",
  image: "/images/instructors/john.jpg",
  linkedin: "https://www.linkedin.com/in/johndoe",
  twitter: "https://twitter.com/johndoe",
  website: "https://johndoe.dev",
};

const instructorCoursesMock = [
  { id: 2, title: "Advanced React Patterns", instructor: "John Doe", price: "$49.99", image: "/images/classes/react-advanced.jpg" },
  { id: 3, title: "Next.js Masterclass", instructor: "John Doe", price: "$79.99", image: "/images/classes/nextjs.jpg" },
];

// Example Usage
const InstructorProfilePage = () => (
  <InstructorProfile instructor={instructorMock} courses={instructorCoursesMock} />
);

export default InstructorProfilePage;
