import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import styles from "./AIRecommendations.module.scss";

const recommendedCourses = [
  { id: 4, title: "Advanced JavaScript", category: "JavaScript" },
  { id: 5, title: "Python for Data Science", category: "Data Science" },
  { id: 6, title: "Blockchain & NFTs", category: "Blockchain" },
];

const AIRecommendations = () => {
  return (
    <div className={styles.section}>
      <h2 className={styles.title}>🤖 AI-Based Recommendations</h2>
      <div className={styles.grid}>
        {recommendedCourses.map((course) => (
          <motion.div
            key={course.id}
            className={styles.card}
            whileHover={{ scale: 1.05 }}
          >
            <h3 className={styles.cardTitle}>{course.title}</h3>
            <p className={styles.category}>Category: {course.category}</p>
            <Link href={`/classes/${course.id}/details`}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                className={styles.button}
              >
                View Course
              </motion.button>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AIRecommendations;
