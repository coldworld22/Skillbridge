import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { FaHeart, FaThumbsUp } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { formatCurrency } from '@/utils/currency';

const formatDate = (value) => {
  if (!value) return 'Flexible schedule';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Flexible schedule';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const computeDurationLabel = (start, end) => {
  if (!start || !end) return 'Self-paced';
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return 'Self-paced';
  }
  const diffInMs = endDate.getTime() - startDate.getTime();
  if (diffInMs <= 0) return 'Self-paced';
  const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''}`;
  }
  const diffInWeeks = Math.ceil(diffInDays / 7);
  return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''}`;
};

const resolveSpotsLeft = (classData) => {
  const provided =
    typeof classData.spotsLeft === 'number'
      ? classData.spotsLeft
      : typeof classData.spots_left === 'number'
      ? classData.spots_left
      : null;
  if (typeof provided === 'number' && Number.isFinite(provided)) {
    return Math.max(0, provided);
  }
  const maxStudents = Number.isFinite(Number(classData.max_students))
    ? Number(classData.max_students)
    : null;
  const enrolled = Number.isFinite(Number(classData.enrolled_count))
    ? Number(classData.enrolled_count)
    : 0;
  if (maxStudents === null) return null;
  return Math.max(0, maxStudents - enrolled);
};

function ClassCard({ classData }) {
  const {
    id,
    title,
    instructor,
    scheduleStatus,
    startDate,
    start_date,
    endDate,
    end_date,
    coverImage,
    cover_image,
    price,
    currency,
    currency_code,
    access_type,
    accessType,
  } = classData;

  const start = startDate || start_date;
  const end = endDate || end_date;
  const imageSrc =
    coverImage || cover_image || classData.image || '/default-class.jpg';
  const normalizedPrice =
    price === null || price === undefined || price === ''
      ? null
      : Number(price);
  const priceValue =
    normalizedPrice === null || Number.isNaN(normalizedPrice)
      ? null
      : normalizedPrice;
  const resolvedAccessType = (access_type || accessType || '').toLowerCase();
  const isPlanOnly = resolvedAccessType === 'free';
  const priceLabel = useMemo(() => {
    if (isPlanOnly) return 'Plan members only';
    if (priceValue === null || priceValue <= Number.EPSILON) return 'Free';
    return formatCurrency(priceValue, {
      currency: currency || currency_code,
      fallback: `$${priceValue.toFixed(2)}`,
    });
  }, [isPlanOnly, priceValue, currency, currency_code]);
  const durationLabel = useMemo(
    () => classData.duration || computeDurationLabel(start, end),
    [classData.duration, start, end]
  );
  const calloutLabel = useMemo(() => {
    if (scheduleStatus) return scheduleStatus;
    if (!start) return 'Upcoming';
    const now = new Date();
    const startDateObj = new Date(start);
    const endDateObj = end ? new Date(end) : null;
    if (!Number.isNaN(startDateObj.getTime()) && now < startDateObj)
      return 'Upcoming';
    if (
      !Number.isNaN(startDateObj.getTime()) &&
      endDateObj &&
      !Number.isNaN(endDateObj.getTime()) &&
      now >= startDateObj &&
      now <= endDateObj
    ) {
      return 'Ongoing';
    }
    return 'Completed';
  }, [scheduleStatus, start, end]);
  const spotsLeft = resolveSpotsLeft(classData);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('likedClasses')) || [];
      setLiked(stored.some((c) => c.id === id));
    } catch (_err) {
      setLiked(false);
    }
  }, [id]);

  const persistList = (key, payload) => {
    try {
      const stored = JSON.parse(localStorage.getItem(key)) || [];
      if (stored.find((c) => c.id === payload.id)) {
        return false;
      }
      stored.push(payload);
      localStorage.setItem(key, JSON.stringify(stored));
      return true;
    } catch (_err) {
      return false;
    }
  };

  const addToWishlist = (e) => {
    e.preventDefault();
    const success = persistList('wishlist', {
      id,
      title,
      image: imageSrc,
      instructor,
      price: priceValue ?? 0,
    });
    if (success) toast.success('Added to wishlist');
    else toast.info('Already in wishlist');
  };

  const likeClass = (e) => {
    e.preventDefault();
    const success = persistList('likedClasses', {
      id,
      title,
      image: imageSrc,
      instructor,
      price: priceValue ?? 0,
    });
    if (success) {
      setLiked(true);
      toast.success('Class liked');
    } else {
      toast.info('Already liked');
    }
  };

  const statusStyles = {
    Upcoming: 'bg-blue-500/20 text-blue-300',
    Ongoing: 'bg-green-500/20 text-green-300',
    Completed: 'bg-gray-500/20 text-gray-300',
  };

  const statusClass =
    statusStyles[calloutLabel] || 'bg-gray-500/20 text-gray-300';

  return (
    <Link href={`/online-classes/${id}`}>
      <div className="cursor-pointer bg-gray-900 rounded-lg shadow-lg p-5 flex flex-col hover:shadow-xl hover:ring-2 hover:ring-yellow-500 transition relative group">
        <div className="h-40 mb-4 overflow-hidden rounded-md relative">
          <img
            src={imageSrc}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <button
            onClick={addToWishlist}
            className="absolute top-2 right-2 bg-gray-800/80 hover:bg-gray-800 p-2 rounded-full transition"
            aria-label="Add to wishlist"
          >
            <FaHeart className="text-yellow-400" />
          </button>
          <button
            onClick={likeClass}
            className="absolute top-2 left-2 bg-gray-800/80 hover:bg-gray-800 p-2 rounded-full transition"
            aria-label="Like this class"
          >
            <FaThumbsUp className={liked ? 'text-yellow-400' : 'text-gray-400'} />
          </button>
          <span
            className={`absolute bottom-2 left-2 px-2 py-1 text-xs font-semibold rounded-full ${statusClass}`}
          >
            {calloutLabel}
          </span>
        </div>

        <h4 className="text-xl font-bold text-yellow-400 line-clamp-2">
          {title}
        </h4>
        <p className="text-sm text-gray-300 mb-2">
          Instructor:{' '}
          <span className="text-white font-medium">
            {instructor || 'TBA'}
          </span>
        </p>

        <div className="text-sm text-gray-400 space-y-1 mb-4">
          <p>📅 Start: {formatDate(start)}</p>
          <p>🕒 Duration: {durationLabel}</p>
          <p>💰 Price: {priceLabel}</p>
          <p>👥 Spots Left: {spotsLeft === null ? 'Unlimited' : spotsLeft}</p>
        </div>

        <div
          className={`mt-auto px-4 py-2 text-center rounded-md font-semibold ${
            spotsLeft === 0
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-yellow-500 text-black hover:bg-yellow-400'
          }`}
        >
          {spotsLeft === 0 ? 'Full' : 'View Details'}
        </div>
      </div>
    </Link>
  );
}

export default ClassCard;
