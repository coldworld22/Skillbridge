import { FaTrash, FaPlus, FaMinus, FaGift } from "react-icons/fa";
import { motion } from "framer-motion";

export default function CartItem({
  item,
  index,
  onIncrease,
  onDecrease,
  onRemove,
}) {
  return (
    <motion.li
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="flex justify-between items-center border-b border-gray-700 pb-4"
    >
      <div className="flex items-center space-x-4">
        <FaGift className="text-yellow-500 text-4xl" />
        <div>
          <h3 className="text-lg font-semibold">
            {index + 1}. {item.name}
          </h3>
          <p className="text-gray-400">${item.price} per item</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onDecrease}
          className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full"
        >
          <FaMinus />
        </motion.button>
        <span className="text-lg font-bold">{item.quantity}</span>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onIncrease}
          className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full"
        >
          <FaPlus />
        </motion.button>
      </div>
      <div className="flex items-center space-x-4">
        <motion.button
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          onClick={onRemove}
          className="p-2 text-red-500 hover:text-red-600"
        >
          <FaTrash />
        </motion.button>
      </div>
    </motion.li>
  );
}

