import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

const ClassCard = ({ course }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05, boxShadow: "0px 10px 20px rgba(255, 255, 255, 0.1)" }}
      className="bg-gray-800 p-4 rounded-lg shadow-lg transform transition duration-300"
    >
      <Image src={course.image} alt={course.title} width={400} height={250} className="rounded-lg" />
      <h3 className="text-xl font-semibold mt-4 text-yellow-400">{course.title}</h3>
      <p className="text-gray-400">Instructor: {course.instructor}</p>
      <p className="text-yellow-500 font-bold">{course.price}</p>

      {/* Navigate to Class Details */}
      <Link href={`/classes/details/${course.id}`}>
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
        >
          View Class
        </motion.button>
      </Link>
    </motion.div>
  );
};

export default ClassCard;
