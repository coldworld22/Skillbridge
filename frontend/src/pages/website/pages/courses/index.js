import { useEffect, useState } from "react";
import CourseCard from "@/components/website/CourseCard";
import { courseService } from "@/services/courseService"; // ✅ Correct if it's a named export


const CoursesPage = () => {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await courseService.getAllCourses();
        setCourses(response);
      } catch (error) {
        console.error("Failed to load courses:", error);
      }
    };
    fetchCourses();
  }, []);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-6">Browse Online Classes</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </div>
  );
};

export default CoursesPage;
