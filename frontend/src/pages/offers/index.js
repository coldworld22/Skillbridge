import React, { useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  FaSearch,
  FaTag,
  FaUserGraduate,
  FaChalkboardTeacher,
  FaPlus,
} from "react-icons/fa";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";

const sampleOffers = [
  {
    id: 1,
    title: "Need Physics Tutor",
    type: "student",
    price: "$200",
    duration: "3 months",
    tags: ["OneOnOne", "Urgent"],
    date: "2024-04-03T12:00:00Z",
  },
  {
    id: 2,
    title: "Math Tutoring Available",
    type: "instructor",
    price: "$100/month",
    duration: "8 months",
    tags: ["Discount", "LiveClass"],
    date: "2024-04-05T08:00:00Z",
  },
  {
    id: 3,
    title: "Seeking Spanish Lessons",
    type: "student",
    price: "$150",
    duration: "5 months",
    tags: ["Flexible"],
    date: "2024-04-04T10:30:00Z",
  },
];

const tagColors = {
  Urgent: "bg-red-500 text-white",
  OneOnOne: "bg-blue-300 text-black",
  Discount: "bg-green-300 text-black",
  Flexible: "bg-purple-300 text-black",
  LiveClass: "bg-pink-300 text-black",
};

const OfferBadge = ({ type }) => (
  <span
    className={`text-xs px-2 py-1 rounded-full font-semibold shadow ${
      type === "student" ? "bg-blue-600 text-white" : "bg-green-500 text-white"
    }`}
  >
    {type === "student" ? "Student Request" : "Instructor Offer"}
  </span>
);

const OffersPage = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  const filtered = sampleOffers
    .filter(
      (offer) =>
        offer.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        (filterType === "all" || offer.type === filterType)
    )
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="bg-gray-950 text-white min-h-screen">
      <Navbar />

      <section className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.h1
            className="text-4xl font-extrabold text-yellow-400 text-center mb-4"
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            📢 All Learning Offers
          </motion.h1>

          <p className="text-center text-gray-300 mb-6">
            Explore student requests and instructor offers.
          </p>

          <p className="text-center text-sm text-gray-500 mb-8">
            Showing {filtered.length} {filterType === "all" ? "offers" : `${filterType} offers`}
          </p>

          {/* Filter Buttons */}
          <div className="flex justify-center gap-3 flex-wrap mb-6">
            {[
              { label: "All", value: "all" },
              { label: "Students", value: "student" },
              { label: "Instructors", value: "instructor" },
            ].map((btn) => (
              <button
                key={btn.value}
                onClick={() => setFilterType(btn.value)}
                className={`px-4 py-2 rounded-full border text-sm font-medium transition ${
                  filterType === btn.value
                    ? "bg-yellow-500 text-black border-yellow-400"
                    : "border-gray-600 text-yellow-300"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="mb-10 max-w-md mx-auto relative">
            <FaSearch className="absolute top-3 left-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search offers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full rounded bg-gray-800 text-white border border-gray-600 focus:outline-yellow-400"
            />
          </div>

          {/* Offers Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.length > 0 ? (
              filtered.map((offer, index) => (
                <motion.div
                  key={offer.id}
                  whileHover={{ scale: 1.03 }}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                  className="bg-gray-800 hover:bg-gray-700 p-5 rounded-lg shadow-md cursor-pointer transition-all duration-300"
                  onClick={() => router.push(`/offers/${offer.id}`)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xl">
                      {offer.type === "student" ? (
                        <FaUserGraduate className="text-blue-400" />
                      ) : (
                        <FaChalkboardTeacher className="text-green-400" />
                      )}
                    </div>
                    <OfferBadge type={offer.type} />
                  </div>
                  <h3 className="text-yellow-300 font-bold text-lg truncate mb-1">
                    {offer.title}
                  </h3>
                  <p className="text-sm text-gray-400 mb-2">
                    {new Date(offer.date).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-300 mb-1">
                    <strong>Duration:</strong> {offer.duration}
                  </p>
                  <p className="text-sm text-gray-300 mb-2">
                    <strong>Price:</strong> {offer.price}
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {offer.tags.map((tag, index) => (
                      <span
                        key={index}
                        className={`px-2 py-1 rounded-full font-medium flex items-center gap-1 ${
                          tagColors[tag] || "bg-yellow-500 text-black"
                        }`}
                      >
                        <FaTag className="text-xs" /> {tag}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full text-center text-gray-500 text-lg py-20">
                😕 No offers found. Try a different search.
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="text-center mt-14">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/offers/new")}
              className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-gray-900 text-lg font-bold rounded-full shadow-lg transition"
            >
              <FaPlus /> Post an Offer
            </motion.button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default OffersPage;
