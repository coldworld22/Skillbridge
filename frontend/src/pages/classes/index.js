import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import ClassCard from "@/components/classes/ClassCard";
import FilterSidebar from "@/components/classes/FilterSidebar";
import SearchBar from "@/components/shared/SearchBar";

const dummyClasses = [
  { id: 1, title: "Mastering React.js", instructor: "John Doe", price: "$0", category: "React", level: "Beginner", rating: 4.8, views: 100, image: "/images/classes/react.jpg" },
  { id: 2, title: "Full Stack with Node.js", instructor: "Jane Smith", price: "$49.99", category: "Node.js", level: "Intermediate", rating: 4.2, views: 200, image: "/images/classes/node.jpg" },
  { id: 3, title: "Deep Learning Basics", instructor: "Alan Turing", price: "$99.99", category: "AI", level: "Advanced", rating: 5.0, views: 150, image: "/images/classes/ai.jpg" },
  { id: 4, title: "UI/UX Design Mastery", instructor: "Sarah Adams", price: "$29.99", category: "Design", level: "Intermediate", rating: 4.7, views: 180, image: "/images/classes/design.jpg" },
  { id: 5, title: "JavaScript Advanced Concepts", instructor: "Elon Dev", price: "$39.99", category: "JavaScript", level: "Advanced", rating: 4.9, views: 220, image: "/images/classes/js.jpg" },
];

const ClassesPage = () => {
  const [filteredClasses, setFilteredClasses] = useState(dummyClasses);
  const [recentlyViewed, setRecentlyViewed] = useState(dummyClasses.slice(0, 3)); // Mocked
  const [popularClasses, setPopularClasses] = useState(dummyClasses.slice(0, 3)); // Mocked
  const [personalizedClasses, setPersonalizedClasses] = useState(dummyClasses.slice(0, 3)); // Mocked
  const [showMoreRecent, setShowMoreRecent] = useState(false);
  const [showMorePopular, setShowMorePopular] = useState(false);
  const [showMorePersonalized, setShowMorePersonalized] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const classesPerPage = 6;
  const indexOfLastClass = currentPage * classesPerPage;
  const indexOfFirstClass = indexOfLastClass - classesPerPage;
  const currentClasses = filteredClasses.slice(indexOfFirstClass, indexOfLastClass);

  const nextPage = () => {
    if (indexOfLastClass < filteredClasses.length) setCurrentPage(currentPage + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <Navbar />

      <div className="container mx-auto px-6 py-8 mt-16">
        <motion.h1 
          className="text-4xl font-bold text-center mb-4 text-yellow-400"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Browse Online Classes
        </motion.h1>

        <motion.p 
          className="text-center text-gray-300 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          Explore and enroll in a variety of online classes.
        </motion.p>

        {/* Search Bar */}
        <SearchBar placeholder="Search for classes..." />

        <div className="flex gap-6 mt-6">
          {/* Sidebar Filters */}
          <FilterSidebar />

          <div className="flex-grow">
            {/* Animated Sections */}
            {[
              { title: "Recently Viewed Classes", data: recentlyViewed, showMore: showMoreRecent, setShowMore: setShowMoreRecent },
              { title: "Most Popular Classes", data: popularClasses, showMore: showMorePopular, setShowMore: setShowMorePopular },
              { title: "Personalized Specializations for You", data: personalizedClasses, showMore: showMorePersonalized, setShowMore: setShowMorePersonalized },
            ].map((section, index) => (
              <motion.div 
                key={index}
                className="mb-10"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2, duration: 0.8 }}
              >
                <h2 className="text-2xl font-semibold text-yellow-400 mb-4">{section.title}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {section.data.slice(0, section.showMore ? section.data.length : 3).map((course) => (
                    <ClassCard key={course.id} course={course} />
                  ))}
                </div>
                {section.data.length > 3 && ( 
                  <motion.button
                    onClick={() => section.setShowMore(!section.showMore)}
                    className="mt-4 bg-blue-600 text-white px-5 py-2 rounded-full hover:bg-blue-700 transition shadow-md"
                    whileHover={{ scale: 1.05 }}
                  >
                    {section.showMore ? "Show Less" : "Show More"}
                  </motion.button>
                )}
                {/* Section Divider */}
                {index < 2 && <hr className="border-t-2 border-gray-700 mt-6" />}
              </motion.div>
            ))}

            {/* Class List */}
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              {currentClasses.length > 0 ? (
                currentClasses.map((course) => <ClassCard key={course.id} course={course} />)
              ) : (
                <p className="text-gray-400">No classes found.</p>
              )}
            </motion.div>

            {/* Pagination with Animations */}
            <div className="flex justify-center items-center gap-4 mt-8">
              <motion.button
                onClick={prevPage}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-full transition shadow-md ${currentPage === 1 ? "bg-gray-700 cursor-not-allowed" : "bg-yellow-500 hover:bg-yellow-600"}`}
                whileHover={{ scale: 1.05 }}
              >
                ⬅️ Previous
              </motion.button>

              <span className="text-white bg-gray-800 px-5 py-2 rounded-full">{currentPage}</span>

              <motion.button
                onClick={nextPage}
                disabled={indexOfLastClass >= filteredClasses.length}
                className={`px-4 py-2 rounded-full transition shadow-md ${indexOfLastClass >= filteredClasses.length ? "bg-gray-700 cursor-not-allowed" : "bg-yellow-500 hover:bg-yellow-600"}`}
                whileHover={{ scale: 1.05 }}
              >
                Next ➡️
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ClassesPage;
