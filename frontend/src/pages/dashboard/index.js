import React from "react";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import AIRecommendations from "@/components/dashboard/AIRecommendations";
import { motion } from "framer-motion";
import Link from "next/link";
import { getRecommendedCourses } from "@/services/aiCourseRecommendation";

const allCourses = [
  { id: 1, title: "Mastering React.js", category: "JavaScript", progress: 80 },
  { id: 2, title: "Full Stack with Node.js", category: "JavaScript", progress: 50 },
  { id: 3, title: "AI & Machine Learning Basics", category: "AI", progress: 20 },
  { id: 4, title: "Advanced JavaScript", category: "JavaScript" },
  { id: 5, title: "Python for Data Science", category: "Data Science" },
  { id: 6, title: "Blockchain & NFTs", category: "Blockchain" },
];

const enrolledCourses = allCourses.slice(0, 3); // Mocked enrolled courses
const recommendedCourses = getRecommendedCourses(enrolledCourses, allCourses);

const DashboardPage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <Navbar />
      <div className="container mx-auto px-6 py-8">
        <motion.h1
          className="text-3xl font-bold text-yellow-400 text-center mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          📊 Student Dashboard
        </motion.h1>

        {/* Enrolled Courses */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {enrolledCourses.map((course) => (
            <motion.div
              key={course.id}
              className="bg-gray-800 p-4 rounded-lg shadow-lg"
              whileHover={{ scale: 1.05 }}
            >
              <h3 className="text-xl font-semibold text-yellow-400">{course.title}</h3>
              <p className="text-gray-300">Progress: {course.progress}%</p>
              <div className="w-full bg-gray-700 rounded-lg overflow-hidden mt-2">
                <motion.div
                  className="bg-yellow-500 text-black text-center py-1"
                  style={{ width: `${course.progress}%` }}
                />
              </div>
              <Link href={`/dashboard/course/${course.id}`}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
                >
                  Continue Learning
                </motion.button>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* AI Course Recommendations */}
        <AIRecommendations recommendedCourses={recommendedCourses} />
      </div>
      <Footer />
    </div>
  );
};

export default DashboardPage;
