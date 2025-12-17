import { motion } from "framer-motion";
import { useRouter } from "next/router";
import { FaStar, FaClock, FaBookmark } from "react-icons/fa";

// 👇 You can replace this with real progress data
const mockProgress = {
  1: 75,
  2: 40,
  3: 100,
  4: 20,
  5: 0,
  6: 60,
};

const getStars = (rating) => {
  const safeRating = Number.isFinite(rating) && rating > 0 ? rating : 0;
  const full = Math.floor(safeRating);
  const half = safeRating % 1 >= 0.5;
  return (
    <>
      {Array.from({ length: full }).map((_, i) => (
        <FaStar key={i} className="text-yellow-400 text-sm" />
      ))}
      {half && <FaStar className="text-yellow-300 opacity-50 text-sm" />}
    </>
  );
};

const RelatedTutorials = ({ tutorials = [] }) => {
  const router = useRouter();

  if (!tutorials.length) return null;

  return (
    <div className="mb-12">
      <motion.h2
        className="text-xl sm:text-2xl font-semibold text-yellow-400 mb-6"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        You Might Also Like
      </motion.h2>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {tutorials.map((tut, index) => (
          <motion.div
            key={tut.id}
            whileHover={{ scale: 1.03 }}
            className="bg-gray-800 rounded-lg overflow-hidden shadow-md cursor-pointer relative group"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            onClick={() => router.push(`/tutorials/${tut.id}`)}
          >
            <div className="relative h-40">
              {tut.preview ? (
                <video
                  src={tut.preview}
                  autoPlay
                  muted
                  loop
                  className="w-full h-full object-cover group-hover:brightness-75"
                />
              ) : (
                <img
                  src={tut.thumbnail}
                  alt={tut.title}
                  className="w-full h-full object-cover group-hover:brightness-75"
                />
              )}
              {tut.tags?.includes("Top Rated") && (
                <span className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 text-xs rounded-full shadow">
                  🔥 Top Rated
                </span>
              )}
              {tut.trending && (
                <span className="absolute top-2 left-2 bg-orange-600 text-white px-2 py-1 text-xs rounded-full shadow">
                  🔥 Trending
                </span>
              )}
              <FaBookmark className="absolute top-2 right-2 text-white bg-gray-700 rounded-full p-1 w-6 h-6 hover:text-yellow-400" />
            </div>

            <div className="p-4">
              <div className="flex items-center gap-2 mb-1">
                {tut.instructorAvatar && (
                  <img
                    src={tut.instructorAvatar}
                    alt={tut.instructor}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                )}
                <h3 className="font-bold text-yellow-400 text-lg truncate">
                  {tut.title}
                </h3>
              </div>
              <p className="text-sm text-gray-300 truncate">
                Instructor: {tut.instructor}
              </p>

              <div className="flex flex-wrap gap-2 mt-2 text-xs">
                <span className="bg-yellow-500 text-black px-2 py-1 rounded-full font-semibold">
                  {tut.level}
                </span>
                {tut.tags?.map((tag, i) => (
                  <span
                    key={i}
                    className="bg-gray-700 px-2 py-1 rounded-full text-yellow-300"
                    title={`Tag: ${tag}`}
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="flex justify-between mt-4 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  {getStars(tut.rating)}
                </span>
                <span className="flex items-center gap-1">
                  <FaClock /> {tut.duration}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mt-3">
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400"
                    style={{ width: `${mockProgress[tut.id] || 0}%` }}
                  />
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Watched: {mockProgress[tut.id] || 0}%
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default RelatedTutorials;
