import { useState } from 'react';
import Link from 'next/link';
import StudentLayout from '@/components/layouts/StudentLayout';
import { FaStar, FaEdit, FaTrash, FaSearch, FaSortAmountDown } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const mockReviews = [
  {
    id: 1,
    type: 'instructor',
    targetId: 'jane-smith',
    name: 'Jane Smith',
    avatar: '/images/instructors/jane.jpg',
    rating: 5,
    date: '2025-05-01',
    text: 'Amazing instructor! Very clear and helpful.',
  },
  {
    id: 2,
    type: 'class',
    targetId: 'advanced-python',
    name: 'Advanced Python',
    avatar: '/images/classes/python.jpg',
    rating: 4,
    date: '2025-04-20',
    text: 'Very thorough, though a bit fast-paced.',
  },
];

export default function StudentReviewsPage() {
  const [reviews, setReviews] = useState(mockReviews);
  const [searchTerm, setSearchTerm] = useState('');
  const [editing, setEditing] = useState(null);
  const [editText, setEditText] = useState('');
  const [sortOption, setSortOption] = useState('newest');

  const handleEdit = (review) => {
    setEditing(review);
    setEditText(review.text);
  };

  const saveEdit = () => {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === editing.id ? { ...r, text: editText } : r
      )
    );
    setEditing(null);
  };

  const deleteReview = (id) => {
    setReviews((prev) => prev.filter((r) => r.id !== id));
  };

  const filteredReviews = reviews
    .filter((r) => r.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortOption === 'newest') return new Date(b.date) - new Date(a.date);
      if (sortOption === 'oldest') return new Date(a.date) - new Date(b.date);
      if (sortOption === 'highest') return b.rating - a.rating;
      if (sortOption === 'lowest') return a.rating - b.rating;
      return 0;
    });

  return (
    <StudentLayout>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-2">My Reviews</h1>
        <p className="text-gray-500 mb-6">Manage your feedback for completed classes and instructors.</p>

        <div className="flex flex-wrap items-center mb-6 gap-4">
          <div className="flex items-center gap-2">
            <FaSearch className="text-gray-400" />
            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border px-4 py-2 rounded w-full max-w-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <FaSortAmountDown className="text-gray-400" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="border px-4 py-2 rounded"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4">
          {filteredReviews.map((review) => (
            <div key={review.id} className="bg-white shadow p-4 rounded flex items-start gap-4">
              <img
                src={review.avatar}
                alt={review.name}
                className="w-16 h-16 rounded object-cover"
              />
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <Link href={
                      review.type === 'class'
                        ? `/online-classes/${review.targetId}`
                        : `/instructors/${review.targetId}`
                    }>
                      <h2 className="text-lg font-semibold text-blue-700 hover:underline">
                        {review.name}
                      </h2>
                    </Link>
                    <span className={`text-xs inline-block px-2 py-1 mt-1 rounded-full ${
                      review.type === 'class'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {review.type === 'class' ? 'Class Review' : 'Instructor Review'}
                    </span>
                    <p className="text-sm text-gray-400 mt-1">{review.date}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 mt-2">
                  {[...Array(5)].map((_, i) => (
                    <FaStar
                      key={i}
                      className={
                        i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                      }
                    />
                  ))}
                </div>
                <p className="mt-2 text-gray-700">{review.text}</p>
                <div className="mt-2 flex gap-4">
                  <button
                    onClick={() => handleEdit(review)}
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <FaEdit /> Edit
                  </button>
                  <button
                    onClick={() => deleteReview(review.id)}
                    className="text-red-600 hover:underline flex items-center gap-1"
                  >
                    <FaTrash /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredReviews.length === 0 && (
            <div className="text-center text-gray-500 py-10">
              No reviews found.
            </div>
          )}
        </div>

        <AnimatePresence>
          {editing && (
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
              >
                <h2 className="text-xl font-semibold mb-4">Edit Review</h2>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={4}
                  className="w-full border p-2 rounded mb-4"
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setEditing(null)} className="px-4 py-2">Cancel</button>
                  <button onClick={saveEdit} className="px-4 py-2 bg-blue-600 text-white rounded">
                    Save
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </StudentLayout>
  );
}
