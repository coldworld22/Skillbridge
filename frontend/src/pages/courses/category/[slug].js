import React from "react";
import { useRouter } from "next/router";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import CourseCategoryList from "@/components/courses/CourseCategoryList";

const CourseCategory = () => {
  const router = useRouter();
  const { slug } = router.query;

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <Navbar />
      <div className="container mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-yellow-400 capitalize">{slug} Courses</h1>
        <CourseCategoryList category={slug} />
      </div>
      <Footer />
    </div>
  );
};

export default CourseCategory;
