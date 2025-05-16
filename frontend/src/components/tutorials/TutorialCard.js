import React from "react";
import { motion } from "framer-motion";
import { Star, Eye, PlayCircle } from "lucide-react";
import Link from "next/link";

const DEFAULT_IMAGE =
  "https://www.classcentral.com/report/wp-content/uploads/2022/06/C-Programming-BCG-Banner.png";
const DEFAULT_AVATAR = "https://i.pravatar.cc/40";

const TutorialCard = ({ tutorial = {} }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className="relative bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition hover:shadow-lg group"
    >
      {/* Thumbnail */}
      <div className="relative">
        <img
          src={tutorial.thumbnail || DEFAULT_IMAGE}
          alt={tutorial.title || "Tutorial"}
          className="w-full h-40 object-cover"
        />

        {/* Play Icon Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
          <PlayCircle className="w-12 h-12 text-white drop-shadow-lg" />
        </div>

        {/* New Badge */}
        {tutorial.isNew && (
          <span className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full shadow-md">
            NEW
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
          {tutorial.title || "Untitled Tutorial"}
        </h3>

        <div className="flex items-center gap-2 mt-1">
          <img
            src={tutorial.instructorAvatar || DEFAULT_AVATAR}
            alt={tutorial.instructor}
            className="w-6 h-6 rounded-full"
          />
          <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
            {tutorial.instructor || "Unknown"}
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mt-3">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-400" />
            {tutorial.rating || 0}
          </div>
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {tutorial.views || 0} views
          </div>
        </div>

        {/* Category, Level, Price, Duration */}
        <div className="mt-3 text-xs text-gray-400 uppercase tracking-wider">
          {tutorial.category || "General"} &middot; {tutorial.level || "N/A"}
        </div>
        <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          {tutorial.price ? `$${tutorial.price}` : "Free"} &middot;{" "}
          {tutorial.duration || "Unknown Duration"}
        </div>

        {/* Explore Button */}
        <Link href={`/tutorials/${tutorial.id || 0}`} passHref>
          <motion.button
            className="mt-4 w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-2 px-4 rounded-full transition"
            whileHover={{ scale: 1.03 }}
          >
            Explore Tutorial
          </motion.button>
        </Link>
      </div>
    </motion.div>
  );
};

export default TutorialCard;
