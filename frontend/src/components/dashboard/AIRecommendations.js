import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useTranslation } from "next-i18next";

const defaultRecommendedCourses = [
  { id: 4, title: "Advanced JavaScript", category: "JavaScript" },
  { id: 5, title: "Python for Data Science", category: "Data Science" },
  { id: 6, title: "Blockchain & NFTs", category: "Blockchain" },
];

const AIRecommendations = ({ recommendedCourses }) => {
  const { t } = useTranslation('dashboard');
  const coursesToDisplay =
    recommendedCourses && recommendedCourses.length > 0
      ? recommendedCourses
      : defaultRecommendedCourses;
  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold text-yellow-400 mb-4">
        {t('dashboardPage.ai_recommendations_title')}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {coursesToDisplay.map((course) => (
          <motion.div
            key={course.id}
            className="bg-gray-800 p-4 rounded-lg shadow-lg"
            whileHover={{ scale: 1.05 }}
          >
            <h3 className="text-xl font-semibold text-yellow-400">{course.title}</h3>
            <p className="text-gray-300">
              {t('dashboardPage.category')}: {course.category}
            </p>
            <Link href={`/classes/${course.id}/details`}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
              >
                {t('dashboardPage.view_course')}
              </motion.button>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AIRecommendations;
