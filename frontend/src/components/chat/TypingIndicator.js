import { motion } from "framer-motion";

const TypingIndicator = ({ names = [] }) => {
  if (!names.length) return null;
  const text =
    names.length === 1
      ? `${names[0]} is typing...`
      : `${names.join(", ")} are typing...`;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ repeat: Infinity, duration: 1 }}
      className="text-gray-400 text-sm mt-2"
    >
      {text}
    </motion.div>
  );
};

export default TypingIndicator;
