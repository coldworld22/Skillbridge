import { motion } from "framer-motion";

const TypingIndicator = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ repeat: Infinity, duration: 1 }}
      className="text-gray-400 text-sm mt-2"
    >
      Typing...
    </motion.div>
  );
};

export default TypingIndicator;
