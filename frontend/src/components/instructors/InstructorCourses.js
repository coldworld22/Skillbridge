import React from "react";
import { useRouter } from "next/router";

const InstructorCourses = ({ courses }) => {
  const router = useRouter();
  
  return (
    <div className="mt-6">
      <h3 className="text-xl font-semibold text-yellow-400">Courses by this Instructor</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
        {courses.map((course) => (
          <div 
            key={course.id} 
            className="bg-gray-700 p-4 rounded-lg cursor-pointer hover:shadow-lg"
            onClick={() => router.push(`/classes/${course.id}`)}
          >
            <img src={course.image} alt={course.title} className="w-full h-32 object-cover rounded-md" />
            <h2 className="text-lg font-semibold text-white mt-2">{course.title}</h2>
            <p className="text-yellow-500 font-bold">{course.price}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InstructorCourses;
