import { motion } from "framer-motion";

export default function EmailAnimation() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
      className="mt-4 text-yellow-500 text-lg font-semibold"
    >
      Secure login with email verification 🔒
    </motion.div>
  );
}
