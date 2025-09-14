export const instructorDashboardMocks = {
  tutorials: [
    { id: 1, title: "React Basics", status: "Draft" },
    { id: 2, title: "Advanced Next.js", status: "Published" },
    { id: 3, title: "JavaScript ES6", status: "Archived" },
  ],
  classes: [
    { id: 1, title: "React Live Session", date: "2025-05-05", time: "10:00 AM" },
    { id: 2, title: "Final Q&A", date: "2025-05-07", time: "02:00 PM" },
  ],
  students: [
    { id: 1, name: "Sara Ali", email: "sara@example.com", classTitle: "React Basics" },
    { id: 2, name: "Omar Nasser", email: "omar@example.com", classTitle: "Advanced Next.js" },
  ],
  assignments: [
    { id: 1, title: "React Components Homework", dueDate: "2025-05-08" },
    { id: 2, title: "Next.js Dynamic Routing", dueDate: "2025-05-10" },
  ],
  certificates: [
    { id: 1, student: "Sara Ali", classTitle: "React Basics", issueDate: "2025-05-01" },
    { id: 2, student: "Omar Nasser", classTitle: "Next.js Bootcamp", issueDate: "2025-05-02" },
  ],
};

export const assignmentMocks = [
  {
    id: 1,
    title: 'Week 1 Homework',
    description: 'Solve the given problems on JSX and Components.',
    dueDate: '2025-05-05',
    classId: 'react-bootcamp',
    uploadedBy: 'instructor',
  },
  {
    id: 2,
    title: 'Week 2 Project',
    description: 'Build a ToDo App with state management.',
    dueDate: '2025-05-12',
    classId: 'react-bootcamp',
    uploadedBy: 'instructor',
  },
];

export const liveClassMocks = {
  "react-bootcamp": {
    title: "React & Next.js Bootcamp",
    instructor: "Ayman Khalid",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    lessons: [
      { title: "Intro to React", duration: "10 min" },
      { title: "JSX & Components", duration: "15 min" },
      { title: "Props & State", duration: "20 min" },
    ],
  },
  "java-crash-course": {
    title: "Java Crash Course",
    instructor: "Sara Ali",
    videoUrl: "https://www.w3schools.com/html/movie.mp4",
    lessons: [
      { title: "Intro to Java", duration: "12 min" },
      { title: "Loops & Conditions", duration: "18 min" },
    ],
  },
};
