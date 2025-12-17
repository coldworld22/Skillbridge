import { motion } from "framer-motion";
import styles from "./auth.module.scss";

export default function EmailAnimation() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
      className={`${styles.helper} ${styles.pill}`}
    >
      Secure login with email verification 🔒
    </motion.div>
  );
}
