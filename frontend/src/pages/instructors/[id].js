import React from "react";
import { useRouter } from "next/router";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import InstructorBio from "@/components/instructors/InstructorBio";
import InstructorCourses from "@/components/instructors/InstructorCourses";

const dummyInstructors = [
  { 
    id: 1, 
    name: "John Doe", 
    bio: "Experienced React.js Developer and Mentor.", 
    image: "/images/instructors/john-doe.jpg", 
    courses: [
      { id: 1, title: "Mastering React.js", price: "$0", image: "/images/classes/react.jpg" }
    ]
  }
];

const InstructorProfile = () => {
  const router = useRouter();
  const { id } = router.query;
  const instructor = dummyInstructors.find((i) => i.id == id);

  if (!instructor) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-900 text-white">
        <Navbar />
        <div className="container mx-auto px-6 py-8 text-center">
          <h1 className="text-3xl font-bold text-red-500">Instructor Not Found</h1>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <Navbar />
      <div className="container mx-auto px-6 py-8">
        <InstructorBio instructor={instructor} />
        <InstructorCourses courses={instructor.courses} />
      </div>
      <Footer />
    </div>
  );
};

export default InstructorProfile;
