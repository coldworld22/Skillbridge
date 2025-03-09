const getAllCourses = async () => {
    const response = await fetch("/api/courses");
    return response.json();
  };
  
  export default { getAllCourses };
  