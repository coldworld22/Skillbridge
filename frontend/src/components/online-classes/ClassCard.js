import React from 'react';
import Link from 'next/link';
import { FaHeart } from 'react-icons/fa';
import { toast } from 'react-toastify';

function ClassCard({ classData, index }) {
  const {
    id,
    title,
    instructor,
    date,
    price,
    spotsLeft,
    duration,
    image,
  } = classData;

  const addToWishlist = (e) => {
    e.preventDefault();
    const stored = JSON.parse(localStorage.getItem('wishlist')) || [];
    if (stored.find((c) => c.id === id)) {
      toast.info('Already in wishlist');
      return;
    }
    stored.push({ id, title, image, instructor, price });
    localStorage.setItem('wishlist', JSON.stringify(stored));
    toast.success('Added to wishlist');
  };

  return (
    <Link href={`/online-classes/${id}`}>
      <div className="cursor-pointer bg-gray-900 rounded-lg shadow-lg p-5 flex flex-col hover:shadow-xl hover:ring-2 hover:ring-yellow-500 transition relative">
        {/* Image */}
        <div className="h-40 mb-4 overflow-hidden rounded-md relative">
          <img
            src={image || '/default-class.jpg'}
            alt={title}
            className="w-full h-full object-cover"
          />
          <button
            onClick={addToWishlist}
            className="absolute top-2 right-2 bg-gray-800 bg-opacity-70 hover:bg-opacity-100 p-2 rounded-full"
          >
            <FaHeart className="text-yellow-400" />
          </button>
        </div>

        {/* Title & Instructor */}
        <h4 className="text-xl font-bold text-yellow-400">{title}</h4>
        <p className="text-sm text-gray-300 mb-2">Instructor: {instructor}</p>

        {/* Details */}
        <div className="text-sm text-gray-400 space-y-1 mb-4">
          <p>📅 Start: {date}</p>
          <p>🕒 Duration: {duration}</p>
          <p>💰 Price: {price === 0 ? 'Free' : `$${price}`}</p>
          <p>👥 Spots Left: {spotsLeft}</p>
        </div>

        {/* Button */}
        <div className={`mt-auto px-4 py-2 text-center rounded-md font-semibold ${
          spotsLeft === 0
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
            : 'bg-yellow-500 text-black hover:bg-yellow-400'
        }`}>
          {spotsLeft === 0 ? 'Full' : 'View Details'}
        </div>
      </div>
    </Link>
  );
}

export default ClassCard;
