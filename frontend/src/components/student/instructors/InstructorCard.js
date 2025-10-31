import { useEffect, useState } from "react";
import {
  FaStar,
  FaUserCheck,
  FaComments,
  FaHeart,
  FaCheckCircle,
  FaSpinner,
} from "react-icons/fa";
import { useRouter } from "next/router";
import { fetchPublicInstructorById } from "@/services/public/instructorService";

export default function InstructorCard({ instructor, isFavorite, onToggleFavorite, onBook, onChat }) {
  const router = useRouter();
  const [rating, setRating] = useState(
    typeof instructor.rating === "number" ? instructor.rating : null
  );
  const [loadingRating, setLoadingRating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadRating = async () => {
      try {
        setLoadingRating(true);
        setError(null);
        const data = await fetchPublicInstructorById(instructor.id);
        if (!isMounted) return;
        if (data && typeof data.rating === "number") {
          setRating(data.rating);
        } else {
          setRating(null);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error("Failed to refresh instructor rating", err);
        setError("Rating unavailable");
      } finally {
        if (isMounted) {
          setLoadingRating(false);
        }
      }
    };

    loadRating();

    return () => {
      isMounted = false;
    };
  }, [instructor.id]);

  const ratingValue = Number.isFinite(rating) ? rating : 0;
  const roundedRating = Math.round(ratingValue);
  const hasRating = Number.isFinite(rating) && rating > 0;
  const ratingLabel = hasRating
    ? Number.isInteger(ratingValue)
      ? ratingValue
      : ratingValue.toFixed(1)
    : "—";
  const avatarSrc = instructor.avatar || "/images/default-avatar.png";

  return (
    <div className="p-6 bg-white rounded-lg shadow border flex flex-col gap-4 relative">
      <button
        onClick={onToggleFavorite}
        className={`absolute top-3 right-3 p-2 rounded-full transition ${
          isFavorite ? "bg-yellow-300 text-black" : "bg-gray-200 text-gray-600"
        }`}
        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        type="button"
      >
        <FaHeart />
      </button>

      <span
        className={`self-start text-xs font-semibold px-3 py-1 rounded-full ${
          instructor.availableNow
            ? "bg-green-100 text-green-700"
            : "bg-gray-200 text-gray-600"
        }`}
      >
        {instructor.availableNow ? "Online" : "Offline"}
      </span>

      {instructor.verified && (
        <span className="absolute top-3 left-3 text-green-500 text-xs flex items-center gap-1 bg-white/90 px-2 py-1 rounded-full">
          <FaCheckCircle /> Verified
        </span>
      )}

      <img
        src={avatarSrc}
        className="w-20 h-20 rounded-full border-2"
        alt={instructor.name}
      />

      <h3
        className="text-lg font-semibold text-center hover:underline cursor-pointer"
        onClick={() => router.push(`/instructors/${instructor.id}`)}
      >
        {instructor.name}
      </h3>

      <div className="text-sm text-gray-600 text-center space-y-1">
        {instructor.expertise && instructor.expertise.length ? (
          <p className="capitalize">
            {Array.isArray(instructor.expertise)
              ? instructor.expertise.join(", ")
              : instructor.expertise}
          </p>
        ) : null}
        {instructor.experience ? (
          <p className="font-medium">
            Experience: <span className="text-gray-800">{instructor.experience}</span>
          </p>
        ) : null}
      </div>

      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-1 text-yellow-400 text-lg">
          {[1, 2, 3, 4, 5].map((value) => (
            <FaStar
              key={value}
              className={value <= roundedRating ? "text-yellow-400" : "text-gray-300"}
            />
          ))}
        </div>
        <div className="text-sm text-gray-600">
          {loadingRating ? (
            <span className="inline-flex items-center gap-2 text-gray-500">
              <FaSpinner className="animate-spin" /> Loading rating...
            </span>
          ) : error ? (
            error
          ) : (
            <span>
              Rating: {ratingLabel} / 5
              {!hasRating && " (No reviews yet)"}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-2 mt-2">
        {instructor.tags.map((tag, idx) => (
          <span
            key={idx}
            className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="flex gap-2 mt-4 flex-wrap justify-center">
        <button
          onClick={onBook}
          className="bg-yellow-400 text-black px-4 py-2 rounded-lg text-sm hover:bg-yellow-500 font-medium transition"
        >
          <FaUserCheck className="inline mr-1" /> Request Lesson
        </button>

        <button
          onClick={onChat}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 font-medium transition"
        >
          <FaComments className="inline mr-1" /> Chat
        </button>

        <button
          onClick={() => router.push(`/instructors/${instructor.id}`)}
          className="bg-gray-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-600 transition"
        >
          View Profile
        </button>
      </div>
    </div>
  );
}
