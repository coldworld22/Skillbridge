import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { FaStar, FaClock, FaFire, FaEye, FaArrowUp, FaSearch, FaFilter } from "react-icons/fa";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import FilterSidebar from "@/components/tutorials/FilterSidebar";
import { fetchPublishedTutorials } from "@/services/tutorialService";

const TutorialsSection = () => {
  // ... existing state and logic remains the same ...

  return (
    <section className="min-h-screen relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-center opacity-10" />
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.h2 
            className="text-4xl md:text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500"
            whileHover={{ scale: 1.02 }}
          >
            📺 Premium Tutorials
          </motion.h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Master new skills with our curated collection of expert-led tutorials
          </p>
        </motion.div>

        {/* Mobile Filters Button */}
        <div className="lg:hidden mb-6 flex justify-between items-center">
          <div className="relative w-full max-w-md">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tutorials..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-800/60 backdrop-blur-sm border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>
          <button 
            className="ml-3 p-2.5 rounded-lg bg-gray-800/60 backdrop-blur-sm border border-gray-700 hover:bg-gray-700 transition-all"
            onClick={() => document.getElementById('filter-sidebar').classList.toggle('translate-x-full')}
          >
            <FaFilter className="text-yellow-400" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filter Sidebar - Enhanced with glass effect */}
          <div 
            id="filter-sidebar"
            className="fixed lg:sticky top-0 left-0 lg:left-auto h-screen lg:h-auto w-full lg:w-1/4 bg-gray-900/80 backdrop-blur-lg lg:backdrop-blur-none lg:bg-transparent p-6 lg:p-0 z-30 transform lg:transform-none transition-transform duration-300 translate-x-full lg:translate-x-0"
          >
            <div className="flex justify-between items-center mb-6 lg:hidden">
              <h3 className="text-xl font-bold text-yellow-400">Filters</h3>
              <button 
                className="text-gray-400 hover:text-white"
                onClick={() => document.getElementById('filter-sidebar').classList.add('translate-x-full')}
              >
                ✕
              </button>
            </div>
            <FilterSidebar
              onFilterChange={handleFilterChange}
              onResetFilters={resetFilters}
            />
          </div>

          <div className="flex-grow">
            {/* Desktop Search & Sort */}
            <div className="hidden lg:flex items-center justify-between gap-4 mb-8">
              <div className="relative w-full max-w-md">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tutorials, instructors..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-800/60 backdrop-blur-sm border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>

              <div className="flex items-center space-x-4">
                <span className="text-gray-400">Sort by:</span>
                <select
                  onChange={(e) => setSortBy(e.target.value)}
                  className="py-2.5 px-4 rounded-lg bg-gray-800/60 backdrop-blur-sm border border-gray-700 text-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="default">Featured</option>
                  <option value="views">Most Viewed</option>
                  <option value="rating">Top Rated</option>
                </select>
              </div>
            </div>

            {/* Results Info */}
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-400">
                Showing <span className="text-yellow-400 font-medium">{visibleTutorials.length}</span> of{" "}
                <span className="text-yellow-400 font-medium">{sortedTutorials.length}</span> tutorials
              </p>
              {filters.categories.length > 0 || filters.levels.length > 0 ? (
                <button 
                  onClick={resetFilters}
                  className="text-sm text-yellow-400 hover:text-yellow-300 flex items-center"
                >
                  Clear all filters
                </button>
              ) : null}
            </div>

            {/* Tutorial Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleTutorials.map((tut) => {
                // ... existing card logic remains the same ...
                
                return (
                  <motion.div
                    key={tut.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -5 }}
                    className="group relative bg-gradient-to-br from-gray-800/60 to-gray-900/80 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700 shadow-2xl cursor-pointer"
                    onClick={() => router.push(`/tutorials/${tut.id}`)}
                  >
                    {/* Premium Badge */}
                    {tut.is_paid && (
                      <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full">
                        PREMIUM
                      </div>
                    )}
                    
                    {/* Thumbnail */}
                    <div className="relative h-44 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent z-10" />
                      {tut.preview ? (
                        <video
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          src={tut.preview}
                          autoPlay
                          muted
                          loop
                        />
                      ) : (
                        <img
                          src={tut.thumbnail}
                          alt={tut.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      )}
                      
                      {/* Progress bar */}
                      {enrolled && (
                        <div className="absolute bottom-0 left-0 right-0 z-20 h-1.5 bg-gray-700">
                          <div
                            className="h-full bg-gradient-to-r from-yellow-500 to-amber-500"
                            style={{ width: `${progressPercent}%` }}
                          ></div>
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold text-lg text-white group-hover:text-yellow-400 transition-colors line-clamp-2">
                          {tut.title}
                        </h3>
                        {tut.trending && (
                          <span className="flex-shrink-0 bg-gradient-to-r from-red-500 to-orange-500 text-white px-2 py-1 text-xs rounded-full ml-2">
                            <FaFire className="inline mr-1" /> Trending
                          </span>
                        )}
                      </div>
                      
                      {/* Instructor */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex-shrink-0">
                          {(() => {
                            const avatar = tut.instructorAvatar || "/images/default-avatar.png";
                            return (
                              <img
                                src={avatar}
                                alt={tut.instructor}
                                className="w-8 h-8 rounded-full border-2 border-yellow-500"
                              />
                            );
                          })()}
                        </div>
                        <span className="text-gray-300 text-sm">{tut.instructor}</span>
                      </div>
                      
                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="bg-gray-700/60 text-yellow-400 text-xs px-2.5 py-1 rounded-full">
                          {tut.level}
                        </span>
                        {tut.tags?.slice(0, 2).map((tag, i) => (
                          <span key={i} className="bg-gray-700/60 text-gray-300 text-xs px-2.5 py-1 rounded-full">
                            #{tag}
                          </span>
                        ))}
                      </div>
                      
                      {/* Stats */}
                      <div className="flex justify-between items-center border-t border-gray-700/60 pt-4">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center text-sm text-gray-400">
                            <FaStar className="text-yellow-400 mr-1" /> {tut.rating}
                          </span>
                          <span className="flex items-center text-sm text-gray-400">
                            <FaEye className="text-gray-400 mr-1" /> {tut.views}
                          </span>
                        </div>
                        <div className="text-sm font-medium">
                          {tut.is_paid && tut.price ? (
                            <span className="bg-gradient-to-r from-amber-500 to-yellow-500 text-transparent bg-clip-text">
                              ${tut.price}
                            </span>
                          ) : (
                            <span className="text-green-400">Free</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Enrolled Badge */}
                    {enrolled && (
                      <div className="absolute top-3 left-3 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
                        ENROLLED
                      </div>
                    )}
                  </motion.div>
                );
              })}
              
              {/* Empty State */}
              {visibleTutorials.length === 0 && (
                <div className="col-span-full py-16 text-center">
                  <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-8 max-w-md mx-auto border border-gray-700">
                    <div className="text-5xl mb-4">🔍</div>
                    <h3 className="text-xl font-bold text-white mb-2">No tutorials found</h3>
                    <p className="text-gray-400 mb-4">
                      Try adjusting your filters or search terms
                    </p>
                    <button
                      onClick={resetFilters}
                      className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-lg text-black font-medium hover:opacity-90 transition-opacity"
                    >
                      Reset Filters
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Load More */}
            {visibleCount < sortedTutorials.length && (
              <div ref={loader} className="text-center mt-10">
                <div className="inline-flex items-center space-x-2 text-gray-400 animate-pulse">
                  <div className="w-4 h-4 rounded-full bg-yellow-500 animate-bounce"></div>
                  <div className="w-4 h-4 rounded-full bg-yellow-500 animate-bounce delay-100"></div>
                  <div className="w-4 h-4 rounded-full bg-yellow-500 animate-bounce delay-200"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scroll to Top */}
      {showScrollToTop && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-20 p-3 bg-gradient-to-br from-yellow-500 to-amber-500 text-black rounded-full shadow-lg hover:shadow-xl transition-all"
        >
          <FaArrowUp />
        </motion.button>
      )}

      <Footer />
    </section>
  );
};

export default TutorialsSection;