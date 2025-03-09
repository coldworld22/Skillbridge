import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaStar, FaRegStar } from "react-icons/fa";

const ReviewsSection = () => {
  const [reviews, setReviews] = useState([
    { id: 1, name: "John Doe", rating: 5, review: "Great course! Learned a lot.", date: "2024-03-01" },
    { id: 2, name: "Jane Smith", rating: 4, review: "Well structured and informative.", date: "2024-02-27" },
  ]);

  const [newReview, setNewReview] = useState("");
  const [newRating, setNewRating] = useState(0);
  const [sortBy, setSortBy] = useState("recent");

  // Handle Adding a Review
  const handleSubmitReview = () => {
    if (newReview.trim() === "" || newRating === 0) return;

    const newReviewData = {
      id: reviews.length + 1,
      name: "Anonymous", // Can be replaced with user's actual name
      rating: newRating,
      review: newReview,
      date: new Date().toISOString().split("T")[0], // Format YYYY-MM-DD
    };

    setReviews([...reviews, newReviewData]);
    setNewReview("");
    setNewRating(0);
  };

  // Handle Sorting
  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortBy === "recent") return new Date(b.date) - new Date(a.date);
    if (sortBy === "highest") return b.rating - a.rating;
    return 0;
  });

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg mt-10">
      <h2 className="text-2xl font-bold text-yellow-400">Student Reviews & Ratings</h2>

      {/* Add a Review */}
      <div className="mt-4">
        <textarea
          value={newReview}
          onChange={(e) => setNewReview(e.target.value)}
          placeholder="Write your review..."
          className="w-full p-3 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
        />
        <div className="flex items-center gap-2 mt-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <span key={star} onClick={() => setNewRating(star)} className="cursor-pointer">
              {star <= newRating ? <FaStar className="text-yellow-500" /> : <FaRegStar className="text-gray-400" />}
            </span>
          ))}
        </div>
        <button
          onClick={handleSubmitReview}
          className="mt-2 bg-yellow-500 text-gray-900 px-4 py-2 rounded-lg hover:bg-yellow-600 transition"
        >
          Submit Review
        </button>
      </div>

      {/* Sorting Options */}
      <div className="mt-6 flex justify-between items-center">
        <p className="text-gray-300">Showing {reviews.length} reviews</p>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-gray-700 text-white p-2 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
        >
          <option value="recent">Most Recent</option>
          <option value="highest">Highest Rated</option>
        </select>
      </div>

      {/* Reviews List */}
      <div className="mt-4">
        {sortedReviews.map((review) => (
          <motion.div
            key={review.id}
            className="bg-gray-700 p-4 rounded-lg mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex justify-between">
              <p className="text-yellow-400 font-semibold">{review.name}</p>
              <p className="text-gray-400 text-sm">{review.date}</p>
            </div>
            <div className="flex gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <span key={star}>{star <= review.rating ? <FaStar className="text-yellow-500" /> : <FaRegStar className="text-gray-400" />}</span>
              ))}
            </div>
            <p className="text-gray-300 mt-2">{review.review}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ReviewsSection;
