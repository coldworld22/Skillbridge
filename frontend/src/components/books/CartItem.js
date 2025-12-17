import { FaTrash, FaPlus, FaMinus, FaGift } from "react-icons/fa";
import { motion } from "framer-motion";
import styles from "./CartItem.module.scss";

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
      className={styles.item}
    >
      <div className={styles.info}>
        <FaGift className={styles.icon} />
        <div>
          <h3 className={styles.title}>
            {index + 1}. {item.name}
          </h3>
          <p className={styles.subtitle}>${item.price} per item</p>
        </div>
      </div>

      <div className={styles.controls}>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onDecrease}
          className={styles.roundBtn}
        >
          <FaMinus />
        </motion.button>
        <span className={styles.count}>{item.quantity}</span>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onIncrease}
          className={styles.roundBtn}
        >
          <FaPlus />
        </motion.button>
      </div>
      <div className={styles.actions}>
        <motion.button
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          onClick={onRemove}
          className={styles.removeBtn}
        >
          <FaTrash />
        </motion.button>
      </div>
    </motion.li>
  );
}
