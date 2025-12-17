import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { FaHeart, FaThumbsUp } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { formatCurrency } from '@/utils/currency';
import styles from './onlineClasses.module.scss';

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

  const statusClasses = {
    Upcoming: styles.statusUpcoming,
    Ongoing: styles.statusOngoing,
    Completed: styles.statusCompleted,
  };
  const statusClass = statusClasses[calloutLabel] || styles.statusCompleted;

  return (
    <Link href={`/online-classes/${id}`}>
      <div className={styles.card}>
        <div className={styles.cardImageWrap}>
          <img
            src={imageSrc}
            alt={title}
            className={styles.cardImage}
          />
          <div className={styles.cardIcon}>
            <button
              onClick={addToWishlist}
              className={styles.iconButton}
              aria-label="Add to wishlist"
            >
              <FaHeart />
            </button>
            <button
              onClick={likeClass}
              className={styles.iconButton}
              aria-label="Like this class"
            >
              <FaThumbsUp color={liked ? '#fbbf24' : '#cbd5e1'} />
            </button>
          </div>
          <span
            className={`${styles.badge} ${statusClass}`}
          >
            {calloutLabel}
          </span>
        </div>

        <h4 className={styles.cardTitle}>
          {title}
        </h4>
        <p className={styles.cardSubtitle}>
          Instructor:{' '}
          <span className={styles.instructorName}>
            {instructor || 'TBA'}
          </span>
        </p>

        <div className={styles.cardMeta}>
          <p>📅 Start: {formatDate(start)}</p>
          <p>🕒 Duration: {durationLabel}</p>
          <p>💰 Price: {priceLabel}</p>
          <p>👥 Spots Left: {spotsLeft === null ? 'Unlimited' : spotsLeft}</p>
        </div>

        <div className={`${styles.cta} ${spotsLeft === 0 ? styles.ctaDisabled : ''}`}>
          {spotsLeft === 0 ? 'Full' : 'View Details'}
        </div>
      </div>
    </Link>
  );
}

export default ClassCard;
