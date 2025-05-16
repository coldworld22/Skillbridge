import React, { useState } from "react";
import { Star } from "lucide-react";
import { motion } from "framer-motion";

const initialReviews = [
  {
    id: 1,
    name: "Alice",
    rating: 5,
    comment: "Great tutorial! Very clear and helpful.",
    date: "2024-04-01",
  },
  {
    id: 2,
    name: "Bob",
    rating: 4,
    comment: "Good content but could use more advanced examples.",
    date: "2024-03-28",
  },
];

const ReviewsSection = () => {
  const [reviews, setReviews] = useState(initialReviews);
  const [newReview, setNewReview] = useState({ name: "", comment: "", rating: 0 });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newReview.name || !newReview.comment || newReview.rating === 0) return;

    const review = {
      id: Date.now(),
      ...newReview,
      date: new Date().toISOString().split("T")[0],
    };
    setReviews([review, ...reviews]);
    setNewReview({ name: "", comment: "", rating: 0 });
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow mt-12">
      <h3 className="text-xl font-bold text-yellow-400 mb-4">Student Reviews</h3>

      {/* List of Reviews */}
      {reviews.map((r) => (
        <div key={r.id} className="border-b border-gray-700 py-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-white font-semibold">{r.name}</span>
            <span className="text-xs text-gray-400">{r.date}</span>
          </div>
          <div className="flex items-center text-yellow-400 mb-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`w-4 h-4 ${i < r.rating ? "" : "text-gray-600"}`} />
            ))}
          </div>
          <p className="text-gray-300 text-sm">{r.comment}</p>
        </div>
      ))}

      {/* Review Form */}
      <form onSubmit={handleSubmit} className="mt-6">
        <h4 className="text-lg font-semibold text-white mb-2">Leave a Review</h4>

        <input
          type="text"
          placeholder="Your Name"
          value={newReview.name}
          onChange={(e) => setNewReview({ ...newReview, name: e.target.value })}
          className="w-full p-2 mb-3 rounded bg-gray-700 text-white placeholder-gray-400"
        />

        <textarea
          rows="3"
          placeholder="Your Review"
          value={newReview.comment}
          onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
          className="w-full p-2 mb-3 rounded bg-gray-700 text-white placeholder-gray-400"
        />

        <div className="flex items-center mb-4">
          <span className="text-white mr-2">Rating:</span>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-5 h-5 cursor-pointer ${i < newReview.rating ? "text-yellow-400" : "text-gray-600"}`}
              onClick={() => setNewReview({ ...newReview, rating: i + 1 })}
            />
          ))}
        </div>

        <motion.button
          type="submit"
          whileHover={{ scale: 1.03 }}
          className="bg-yellow-500 text-black px-6 py-2 rounded-full font-semibold transition hover:bg-yellow-600"
        >
          Submit Review
        </motion.button>
      </form>
    </div>
  );
};

export default ReviewsSection;
