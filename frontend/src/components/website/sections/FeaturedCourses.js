import { motion } from "framer-motion";
import Image from "next/image";
import { FaStar } from "react-icons/fa";

// Dummy Course Data
const courses = [
  {
    id: 1,
    title: "Mastering React & Next.js",
    instructor: "John Doe",
    rating: 4.8,
    price: "$49.99",
    image: "/images/courses/react.png",
  },
  {
    id: 2,
    title: "Data Science & AI Essentials",
    instructor: "Jane Smith",
    rating: 4.7,
    price: "$59.99",
    image: "/images/courses/data-science.png",
  },
  {
    id: 3,
    title: "UI/UX Design for Beginners",
    instructor: "Emily Johnson",
    rating: 4.6,
    price: "$39.99",
    image: "/images/courses/uiux.png",
  },
];

const FeaturedCourses = () => {
  return (

    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      viewport={{ once: true }}
    >
      <section className="py-16 bg-gray-100 text-gray-900 text-center">
        <h2 className="text-4xl font-bold mb-8">Featured Courses</h2>
        <p className="text-lg text-gray-600 mb-10">
          Explore trending courses and boost your skills today!
        </p>

        {/* Course Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {courses.map((course) => (
            <motion.div
              key={course.id}
              className="bg-white shadow-lg rounded-lg overflow-hidden p-5 hover:shadow-2xl transition"
              whileHover={{ scale: 1.05 }}
            >
              <Image
                src={course.image}
                alt={course.title}
                width={500}
                height={300}
                className="rounded-md"
              />
              <div className="mt-4 text-left">
                <h3 className="text-xl font-semibold">{course.title}</h3>
                <p className="text-gray-600">Instructor: {course.instructor}</p>
                <div className="flex items-center mt-2">
                  <FaStar className="text-yellow-500" />
                  <span className="ml-2 text-gray-800 font-bold">{course.rating}</span>
                </div>
                <p className="mt-2 font-bold text-gray-800">{course.price}</p>
                <button className="mt-4 w-full bg-yellow-500 text-gray-900 py-2 rounded-lg font-semibold hover:bg-yellow-600 transition">
                  Enroll Now
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </motion.section>



  );
};

export default FeaturedCourses;
