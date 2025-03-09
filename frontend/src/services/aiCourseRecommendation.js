export const getRecommendedCourses = (enrolledCourses, allCourses) => {
    if (!enrolledCourses || enrolledCourses.length === 0) {
      return allCourses.slice(0, 3); // Default: show any 3 courses
    }
  
    const enrolledCategories = new Set(enrolledCourses.map((course) => course.category));
    
    const recommendedCourses = allCourses
      .filter(course => enrolledCategories.has(course.category) && !enrolledCourses.find(c => c.id === course.id))
      .slice(0, 3);
  
    return recommendedCourses.length > 0 ? recommendedCourses : allCourses.slice(0, 3);
  };
  