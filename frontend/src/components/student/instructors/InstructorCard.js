import { FaStar, FaUserCheck, FaComments, FaHeart, FaCheckCircle } from "react-icons/fa";
import { useRouter } from "next/router";

export default function InstructorCard({ instructor, isFavorite, onToggleFavorite, onBook, onChat }) {
  const router = useRouter();

  return (
    <div className="p-5 bg-white rounded-lg shadow border text-center flex flex-col items-center relative">
      {instructor.availableNow && (
        <span className="absolute top-2 right-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
          Online
        </span>
      )}

      {instructor.verified && (
        <span className="absolute top-2 left-2 text-green-500 text-xs flex items-center gap-1">
          <FaCheckCircle /> Verified
        </span>
      )}

      <img
        src={instructor.avatar}
        className="w-20 h-20 rounded-full border-2 mb-3"
        alt={instructor.name}
      />

      <h3
        className="text-lg font-semibold hover:underline cursor-pointer"
        onClick={() => router.push(`/instructors/${instructor.id}`)}
      >
        {instructor.name}
      </h3>

      <p className="text-sm text-gray-500">
        {instructor.expertise} · {instructor.experience}
      </p>

      <div className="flex items-center justify-center gap-1 mt-1">
        {Array.from({ length: 5 }).map((_, idx) => (
          <FaStar
            key={idx}
            className={idx < Math.floor(instructor.rating) ? "text-yellow-400" : "text-gray-300"}
          />
        ))}
        <span className="text-sm text-gray-600">({instructor.rating})</span>
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
          className="bg-yellow-400 text-black px-4 py-2 rounded-lg text-sm hover:bg-yellow-500"
        >
          <FaUserCheck className="inline mr-1" /> Book
        </button>

        <button
          onClick={onChat}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600"
        >
          <FaComments className="inline mr-1" /> Chat
        </button>

        <button
          onClick={() => router.push(`/instructors/${instructor.id}`)}
          className="bg-gray-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-600"
        >
          View Profile
        </button>

        <button
          onClick={onToggleFavorite}
          className={`p-2 rounded-full hover:bg-gray-200 ${
            isFavorite ? "bg-yellow-300 text-black" : "bg-gray-300 text-white"
          }`}
        >
          <FaHeart />
        </button>
      </div>
    </div>
  );
}
