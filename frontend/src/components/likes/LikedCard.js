import React from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';

export default function LikedCard({ course, onRemove }) {
  const router = useRouter();

  const removeFromLikes = () => {
    let likes = JSON.parse(localStorage.getItem('likedClasses')) || [];
    likes = likes.filter((c) => c.id !== course.id);
    localStorage.setItem('likedClasses', JSON.stringify(likes));
    if (onRemove) onRemove(likes);
  };

  return (
    <motion.div
      className="bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col items-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <img src={course.image} alt={course.title} className="w-full h-40 object-cover rounded-md" />
      <h2 className="text-lg font-semibold text-yellow-400 mt-2">{course.title}</h2>
      <p className="text-gray-300">{course.instructor}</p>
      <p className="text-yellow-500 font-bold mt-1">{course.price === 0 ? 'Free' : course.price}</p>

      <div className="mt-4 flex gap-2">
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          onClick={() => router.push(`/online-classes/${course.id}`)}
        >
          View Class
        </button>
        <button
          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
          onClick={removeFromLikes}
        >
          Remove
        </button>
      </div>
    </motion.div>
  );
}
