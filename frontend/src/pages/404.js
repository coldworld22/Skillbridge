import { motion } from "framer-motion";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
      {/* Animated 404 Text */}
      <motion.h1 
        className="text-6xl font-bold text-yellow-500"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        404
      </motion.h1>

      <p className="mt-4 text-gray-400 text-lg">Oops! The page you're looking for doesn't exist.</p>

      {/* Return Home Button */}
      <Link href="/" passHref>
        <motion.button
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.3 }}
          className="mt-6 px-6 py-3 bg-yellow-500 text-gray-900 rounded-lg font-semibold hover:bg-yellow-600 transition"
        >
          Go Home
        </motion.button>
      </Link>
    </div>
  );
}
