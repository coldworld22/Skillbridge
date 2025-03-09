import React, { useRef } from "react";
import { motion } from "framer-motion";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import ClassCard from "@/components/classes/ClassCard";

const RelatedCourses = ({ courses, category }) => {
  const carouselRef = useRef(null);

  // Scroll left & right functions
  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  // Filter related courses based on category
  const relatedCourses = courses.filter((course) => course.category === category);

  if (relatedCourses.length === 0) return null;

  return (
    <div className="mt-10 bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold text-yellow-400 mb-4">Related Courses</h2>

      {/* Carousel Wrapper */}
      <div className="relative">
        {/* Scroll Left Button */}
        <button
          onClick={scrollLeft}
          className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-gray-700 p-2 rounded-full text-white hover:bg-gray-600 shadow-md"
        >
          <FaChevronLeft size={20} />
        </button>

        {/* Carousel Content */}
        <motion.div
          ref={carouselRef}
          className="flex gap-4 overflow-x-scroll no-scrollbar px-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          {relatedCourses.map((course) => (
            <motion.div
              key={course.id}
              className="min-w-[250px]"
              whileHover={{ scale: 1.05 }}
            >
              <ClassCard course={course} />
            </motion.div>
          ))}
        </motion.div>

        {/* Scroll Right Button */}
        <button
          onClick={scrollRight}
          className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-gray-700 p-2 rounded-full text-white hover:bg-gray-600 shadow-md"
        >
          <FaChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

// Mock Data for Testing
const coursesMock = [
  { id: 1, title: "Mastering React.js", instructor: "John Doe", price: "$0", category: "React", image: "/images/classes/react.jpg" },
  { id: 2, title: "React Native Fundamentals", instructor: "Jane Smith", price: "$39.99", category: "React", image: "/images/classes/react-native.jpg" },
  { id: 3, title: "Advanced React Patterns", instructor: "John Doe", price: "$49.99", category: "React", image: "/images/classes/react-advanced.jpg" },
  { id: 4, title: "Next.js for Beginners", instructor: "Sarah Adams", price: "$59.99", category: "React", image: "/images/classes/nextjs.jpg" },
];

// Example Usage
const RelatedCoursesPage = () => (
  <RelatedCourses courses={coursesMock} category="React" />
);

export default RelatedCoursesPage;
