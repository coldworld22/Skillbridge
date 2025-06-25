
import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { fetchClassReviews, submitClassReview } from '@/services/classService';

const ClassReviews = ({ classId, canReview }) => {
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ comment: '', rating: 0 });

  useEffect(() => {
    if (!classId) return;
    const load = async () => {
      try {
        const list = await fetchClassReviews(classId);
        setReviews(list);
      } catch (err) {
        console.error('Failed to load reviews', err);
      }
    };
    load();
  }, [classId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newReview.comment || newReview.rating === 0) return;

    try {
      await submitClassReview(classId, newReview);
      const list = await fetchClassReviews(classId);
      setReviews(list);
      setNewReview({ comment: '', rating: 0 });
    } catch (err) {
      console.error('Failed to submit review', err);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow mb-12">
      <h3 className="text-xl font-bold text-yellow-400 mb-4">Student Reviews</h3>

      {reviews.map((r) => (
        <div key={r.id} className="border-b border-gray-700 py-4">
          <div className="flex items-center justify-between mb-1">

            <span className="text-white font-semibold">{r.full_name}</span>
            <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</span>

          </div>
          <div className="flex items-center text-yellow-400 mb-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`w-4 h-4 ${i < r.rating ? '' : 'text-gray-600'}`} />
            ))}
          </div>
          <p className="text-gray-300 text-sm">{r.comment}</p>
        </div>
      ))}

      {canReview && (
        <form onSubmit={handleSubmit} className="mt-6">
          <h4 className="text-lg font-semibold text-white mb-2">Leave a Review</h4>

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
                className={`w-5 h-5 cursor-pointer ${i < newReview.rating ? 'text-yellow-400' : 'text-gray-600'}`}
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
      )}

      {!canReview && (
        <p className="text-gray-400 italic mt-4">Only enrolled students can leave a review.</p>
      )}
    </div>
  );
};

export default ClassReviews;
