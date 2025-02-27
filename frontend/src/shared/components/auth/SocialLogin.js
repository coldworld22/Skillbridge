import { motion } from "framer-motion";
import { FaGoogle, FaFacebook, FaApple } from "react-icons/fa";

export default function SocialLogin() {
  return (
    <div className="mt-4 flex space-x-4">
      <motion.button
        whileHover={{ scale: 1.1 }}
        transition={{ duration: 0.3 }}
        className="w-14 h-14 flex items-center justify-center bg-yellow-500 text-white rounded-full hover:bg-yellow-600 transition"
      >
        <FaGoogle size={28} />
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.1 }}
        transition={{ duration: 0.3 }}
        className="w-14 h-14 flex items-center justify-center bg-yellow-500 text-white rounded-full hover:bg-yellow-600 transition"
      >
        <FaFacebook size={28} />
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.1 }}
        transition={{ duration: 0.3 }}
        className="w-14 h-14 flex items-center justify-center bg-yellow-500 text-white rounded-full hover:bg-yellow-600 transition"
      >
        <FaApple size={28} />
      </motion.button>
    </div>
  );
}
