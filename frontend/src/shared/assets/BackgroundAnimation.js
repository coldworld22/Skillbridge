import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import styles from "./backgroundAnimation.module.scss";

/**
 * Floating star background animation.
 *
 * This component previously generated random positions during the
 * initial render which caused hydration mismatches between the
 * server and client. The random values are now generated after the
 * component mounts on the client to avoid this issue.
 */
export default function BackgroundAnimation() {
  const [stars, setStars] = useState([]);

  useEffect(() => {
    const arr = [...Array(10)].map(() => ({
      top: `${Math.random() * 100}vh`,
      left: `${Math.random() * 100}vw`,
      duration: `${Math.random() * 5 + 5}s`,
    }));
    setStars(arr);
  }, []);

  return (
    <div className={styles.container}>
      {stars.map((style, i) => (
        <motion.div
          key={i}
          className={styles.star}
          style={{
            top: style.top,
            left: style.left,
            animationDuration: style.duration,
          }}
        >
          ✨
        </motion.div>
      ))}
    </div>
  );
}
