import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Get all courses
export const getCourses = async () => {
  const response = await axios.get(`${API_URL}/courses`);
  return response.data;
};

// Get a single course by ID
export const getCourseById = async (courseId) => {
  const response = await axios.get(`${API_URL}/courses/${courseId}`);
  return response.data;
};

// Enroll in a course
export const enrollCourse = async (courseId, userId) => {
  return await axios.post(`${API_URL}/courses/enroll`, { courseId, userId });
};
