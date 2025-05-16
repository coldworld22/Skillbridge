// pages/dashboard/instructor/reviews.js
import InstructorLayout from '@/components/layouts/InstructorLayout';
import { FaStar } from 'react-icons/fa';
import { useMemo, useState } from 'react';

const mockReviews = [
  {
    id: 1,
    student: { name: 'Alice Johnson', avatar: 'https://i.pravatar.cc/150?img=1' },
    rating: 5,
    text: 'Amazing instructor. Explained everything clearly and was very patient.',
    class: 'Python Basics',
    date: '2025-05-01'
  },
  {
    id: 2,
    student: { name: 'Mark Lee', avatar: 'https://i.pravatar.cc/150?img=2' },
    rating: 4,
    text: 'Good session overall, but would appreciate more examples.',
    class: 'React Fundamentals',
    date: '2025-05-03'
  },
  {
    id: 3,
    student: { name: 'Sara Kim', avatar: 'https://i.pravatar.cc/150?img=3' },
    rating: 5,
    text: 'Highly recommend! Very professional and engaging.',
    class: 'Data Structures',
    date: '2025-05-05'
  }
];

export default function InstructorReviewsPage() {
  const [filter, setFilter] = useState('all');

  const filteredReviews = useMemo(() => {
    let result = [...mockReviews];
    if (filter === '5') result = result.filter(r => r.rating === 5);
    else if (filter === '4') result = result.filter(r => r.rating === 4);
    else if (filter === 'recent') result.sort((a, b) => new Date(b.date) - new Date(a.date));
    return result;
  }, [filter]);

  const averageRating = useMemo(() => {
    const total = mockReviews.reduce((sum, r) => sum + r.rating, 0);
    return (total / mockReviews.length).toFixed(1);
  }, []);

  const totalReviews = mockReviews.length;

  return (
    <InstructorLayout>
      <section className="py-10 px-4 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">My Reviews</h1>

        {/* Rating Summary */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-2">Overall Rating</h2>
          <div className="flex items-center gap-3">
            <div className="text-4xl font-bold text-yellow-500">{averageRating}</div>
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <FaStar key={i} className={i < Math.round(averageRating) ? 'text-yellow-400' : 'text-gray-300'} />
              ))}
            </div>
            <div className="text-sm text-gray-500 ml-2">from {totalReviews} reviews</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >All</button>
          <button
            onClick={() => setFilter('5')}
            className={`px-4 py-2 rounded ${filter === '5' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >5 Stars</button>
          <button
            onClick={() => setFilter('4')}
            className={`px-4 py-2 rounded ${filter === '4' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >4 Stars</button>
          <button
            onClick={() => setFilter('recent')}
            className={`px-4 py-2 rounded ${filter === 'recent' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >Most Recent</button>
        </div>

        {/* Individual Reviews */}
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <div key={review.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-4 mb-2">
                <img
                  src={review.student.avatar}
                  alt={review.student.name}
                  className="w-10 h-10 rounded-full border"
                />
                <div>
                  <h4 className="font-semibold text-gray-800">{review.student.name}</h4>
                  <p className="text-sm text-gray-500">{review.date} · {review.class}</p>
                </div>
              </div>
              <div className="flex items-center mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <FaStar
                    key={i}
                    className={i < review.rating ? 'text-yellow-400' : 'text-gray-300'}
                  />
                ))}
              </div>
              <p className="text-gray-700 text-sm">{review.text}</p>
            </div>
          ))}
        </div>
      </section>
    </InstructorLayout>
  );
}