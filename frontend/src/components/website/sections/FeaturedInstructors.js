import { motion } from "framer-motion";
import { FaChalkboardTeacher, FaStar } from "react-icons/fa";
import Image from "next/image";

// Dummy Instructor Data
const instructors = [
  {
    id: 1,
    name: "Dr. John Carter",
    expertise: "Artificial Intelligence",
    courses: 10,
    rating: 4.8,
    image: "/images/instructors/instructor1.jpg",
  },
  {
    id: 2,
    name: "Prof. Emily Brown",
    expertise: "Web Development",
    courses: 15,
    rating: 4.9,
    image: "/images/instructors/instructor2.jpg",
  },
  {
    id: 3,
    name: "Mr. David Wilson",
    expertise: "Data Science",
    courses: 8,
    rating: 4.7,
    image: "/images/instructors/instructor3.jpg",
  },
];

const FeaturedInstructors = () => {
  return (

    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      viewport={{ once: true }}
    >
      <section className="py-16 bg-gray-900 text-white text-center">
        <h2 className="text-4xl font-bold mb-8">Meet Our Top Instructors</h2>
        <p className="text-lg text-gray-400 mb-10">
          Learn from the best educators & industry professionals.
        </p>

        {/* Instructor Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {instructors.map((instructor) => (
            <motion.div
              key={instructor.id}
              className="bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-2xl transition transform hover:-translate-y-2"
              whileHover={{ scale: 1.03 }}
            >
              <div className="relative w-28 h-28 mx-auto mb-4">
                <Image
                  src={instructor.image}
                  alt={instructor.name}
                  layout="fill"
                  objectFit="cover"
                  className="rounded-full border-4 border-yellow-500"
                />
              </div>
              <h3 className="text-xl font-semibold">{instructor.name}</h3>
              <p className="text-gray-400">{instructor.expertise}</p>
              <div className="flex justify-center items-center gap-2 text-yellow-500 mt-2">
                <FaChalkboardTeacher /> {instructor.courses} Courses
              </div>
              <div className="flex justify-center items-center gap-2 text-yellow-500 mt-2">
                <FaStar /> {instructor.rating} Rating
              </div>
            </motion.div>
          ))}
        </div>

        {/* Call to Action */}
        <motion.div
          className="mt-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <button className="px-6 py-3 bg-yellow-500 text-gray-900 rounded-lg font-semibold hover:bg-yellow-600 transition shadow-lg">
            View All Instructors
          </button>
        </motion.div>
      </section>
    </motion.section>



  );
};

export default FeaturedInstructors;
