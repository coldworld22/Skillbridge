import React, { useState, useEffect } from 'react';
import Navbar from '@/components/website/sections/Navbar';
import Footer from '@/components/website/sections/Footer';
import LikedCard from '@/components/likes/LikedCard';

export default function LikesPage() {
  const [likes, setLikes] = useState([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('likedClasses')) || [];
    setLikes(stored);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <Navbar />
      <div className="container mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-yellow-400">Liked Classes</h1>
        {likes.length === 0 ? (
          <p className="text-gray-400 mt-4">You haven't liked any classes yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            {likes.map((course) => (
              <LikedCard key={course.id} course={course} onRemove={setLikes} />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
