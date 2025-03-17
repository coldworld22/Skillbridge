import Link from "next/link";
import { motion } from "framer-motion";
import { FaLaptopCode, FaBrain, FaShieldAlt, FaChartBar, FaStar, FaPlayCircle } from "react-icons/fa";

// ✅ Mock Data (Replace with API in future)
const categories = [
  { name: "Web Development", icon: <FaLaptopCode />, link: "/courses/category/web-development" },
  { name: "Data Science", icon: <FaChartBar />, link: "/courses/category/data-science" },
  { name: "AI & Machine Learning", icon: <FaBrain />, link: "/courses/category/ai-ml" },
  { name: "Cybersecurity", icon: <FaShieldAlt />, link: "/courses/category/cybersecurity" },
];

const featuredCourses = [
  { 
    id: 1, 
    title: "Mastering React.js", 
    instructor: "John Doe", 
    rating: 4.9, 
    price: "$49", 
    image: "/images/courses/react.jpg", 
    link: "/courses/react-masterclass" 
  },
  { 
    id: 2, 
    title: "Python for Data Science", 
    instructor: "Alice Smith", 
    rating: 4.8, 
    price: "$39", 
    image: "/images/courses/python.jpg", 
    link: "/courses/python-data-science" 
  },
  { 
    id: 3, 
    title: "AI & Machine Learning Bootcamp", 
    instructor: "David Johnson", 
    rating: 4.7, 
    price: "$59", 
    image: "/images/courses/ai.jpg", 
    link: "/courses/ai-ml-bootcamp" 
  },
];

const CoursesPage = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-4xl font-bold text-yellow-400 text-center">📚 Explore Courses</h1>
      <p className="mt-2 text-gray-300 text-center">Find the best courses in your field.</p>

      {/* ✅ Featured Courses */}
      <div className="mt-8">
        <h2 className="text-3xl font-semibold text-yellow-400">🔥 Featured Courses</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
          {featuredCourses.map((course) => (
            <motion.div 
              key={course.id} 
              whileHover={{ scale: 1.05 }}
              className="bg-gray-800 p-5 rounded-lg shadow-lg"
            >
              <img src={course.image} alt={course.title} className="w-full h-40 object-cover rounded-md" />
              <h3 className="text-xl font-bold mt-3">{course.title}</h3>
              <p className="text-gray-400">👨‍🏫 {course.instructor}</p>
              <p className="text-yellow-400 flex items-center gap-1 mt-2">
                <FaStar /> {course.rating} / 5.0
              </p>
              <p className="text-green-400 font-bold mt-2">💰 {course.price}</p>
              <div className="flex justify-between mt-4">
                <Link href={course.link}>
                  <button className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg">View Course</button>
                </Link>
                <Link href={`/checkout/${course.id}`}>
                  <button className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg">Enroll Now</button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ✅ Course Categories */}
      <h2 className="text-3xl font-semibold text-yellow-400 mt-12">🎯 Course Categories</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
        {categories.map((category, index) => (
          <motion.div 
            key={index} 
            whileHover={{ scale: 1.1 }}
            className="p-6 bg-gray-800 rounded-lg shadow-lg text-center"
          >
            <div className="text-5xl text-yellow-400 mb-3">{category.icon}</div>
            <h2 className="text-2xl font-bold">{category.name}</h2>
            <Link href={category.link}>
              <button className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-lg">
                Explore
              </button>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* ✅ See All Courses Button */}
      <div className="text-center mt-8">
        <Link href="/courses/all">
          <button className="bg-yellow-500 hover:bg-yellow-600 px-6 py-3 rounded-lg text-black font-bold">
            See All Courses
          </button>
        </Link>
      </div>
    </div>
  );
};

export default CoursesPage;
