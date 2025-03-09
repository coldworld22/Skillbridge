import React from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import ReviewsSection from "@/components/classes/ReviewsSection";
import QandASection from "@/components/classes/QandASection";
import RelatedCourses from "@/components/classes/RelatedCourses";
import CourseDiscussion from "@/components/classes/CourseDiscussion";
import { motion } from "framer-motion";

const dummyClasses = [
  {
    id: 1,
    title: "Mastering React.js",
    instructor: "John Doe",
    price: "$0",
    description: "Learn React from scratch!",
    level: "Beginner",
    image: "/images/classes/react.jpg",
    videoUrl: "https://www.youtube.com/embed/dGcsHMXbSOA",
    testimonials: [
      { name: "Alice", comment: "This course changed my life!", rating: 5 },
      { name: "Bob", comment: "Great content, easy to understand.", rating: 4.5 },
    ]
  }
];

const ClassDetails = () => {
  const router = useRouter();
  const { id } = router.query;
  const course = dummyClasses.find((c) => c.id == id);

  if (!course) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-900 text-white">
        <Navbar />
        <div className="container mx-auto px-6 py- text-center">
          <h1 className="text-3xl font-bold text-red-500">Class Not Found</h1>
          <button
            onClick={() => router.push('/classes')}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            Go Back to Classes
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const addToWishlist = () => {
    let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
    if (!wishlist.find((c) => c.id === course.id)) {
      wishlist.push(course);
      localStorage.setItem("wishlist", JSON.stringify(wishlist));
      alert("Course added to wishlist!");
    } else {
      alert("Course is already in your wishlist!");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <Navbar />
      <div className="container mx-auto px-6 py-8 mt-20">
        {/* Course Banner */}
        <motion.div
          className="relative w-full h-[200px] md:h-[400px] overflow-hidden rounded-lg shadow-lg mb-6"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <h1 className="text-2xl md:text-5xl font-bold text-yellow-400">{course.title}</h1>
          </div>
        </motion.div>

        {/* Course Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left: Course Information */}
          <div className="md:col-span-2 bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl md:text-2xl font-bold text-yellow-400">{course.title}</h2>
            <p className="text-gray-300 mt-2">{course.description}</p>
            <p className="text-lg font-semibold text-yellow-500 mt-2">{course.price}</p>
            <p className="text-gray-300 mt-2">
              Level: <Link href={`/courses/category/${course.level.toLowerCase()}`} className="text-yellow-400 hover:underline">{course.level}</Link>
            </p>

            {/* Instructor Profile */}
            <p className="text-gray-300 mt-2">
              Instructor: 
              <Link href={`/instructors/${course.instructor.toLowerCase().replace(" ", "-")}`} className="text-yellow-400 hover:underline">
                {course.instructor}
              </Link>
            </p>

            {/* Course Sections */}
            <CourseDiscussion />
            <ReviewsSection />
            <QandASection />

            {/* Testimonials */}
            <div className="mt-8">
              <h3 className="text-xl font-semibold text-yellow-400">Student Testimonials</h3>
              <div className="mt-4 space-y-4">
                {course.testimonials.map((review, index) => (
                  <motion.div
                    key={index}
                    className="bg-gray-700 p-4 rounded-lg shadow"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.2 }}
                  >
                    <p className="text-white">"{review.comment}"</p>
                    <p className="text-yellow-400 font-semibold">- {review.name}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Sticky Course Actions */}
          <div className="sticky top-20 bg-gray-800 p-6 rounded-lg shadow-md flex flex-col items-center">
            <h3 className="text-xl font-semibold text-yellow-400">Quick Actions</h3>
            <motion.button
              onClick={() => router.push(`/checkout/${course.id}`)}
              className="mt-4 bg-yellow-500 text-black px-6 py-3 rounded-lg hover:bg-yellow-400 transition w-full"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Enroll Now
            </motion.button>
            <button
              onClick={addToWishlist}
              className="mt-4 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition w-full"
            >
              Add to Wishlist
            </button>
            <button className="mt-4 bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition w-full">
              Share Course
            </button>
          </div>
        </div>

        {/* Related Courses */}
        <RelatedCourses currentCourseId={course.id} />
      </div>

      <Footer />
    </div>
  );
};

export default ClassDetails;
