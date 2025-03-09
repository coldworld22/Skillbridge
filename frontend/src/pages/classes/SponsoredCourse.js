import React from "react";

const SponsoredCourse = ({ course }) => {
  return (
    <div className="bg-blue-800 text-white p-4 rounded-lg shadow-lg">
      <h3 className="text-lg font-bold">{course.title}</h3>
      <p className="text-sm">{course.instructor}</p>
      <p className="text-yellow-300 font-semibold">{course.price}</p>
      <button className="mt-3 bg-yellow-500 text-black px-4 py-2 rounded-lg hover:bg-yellow-400">
        Enroll Now
      </button>
    </div>
  );
};

export default SponsoredCourse;
