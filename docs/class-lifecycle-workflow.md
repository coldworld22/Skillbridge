# Class Lifecycle & Certificate Workflow

This guide explains the typical steps from creating a live class to issuing a certificate to each student.

## 1. Instructor Creates a Class
1. The instructor logs in and navigates to their dashboard.
2. From **Create Class** they provide details like title, schedule, price and max students.
3. The backend route `POST /api/users/classes/admin` stores the class in `online_classes`.
4. Once ready, the instructor publishes the class using `PATCH /api/users/classes/admin/:id/status`.

## 2. Students Enroll
1. Students register an account following the [Student Registration Guide](student-registration-guide.md).
2. On the class page, a student can **Add to Cart** and complete checkout.
3. After payment they are added to `class_enrollments` and can access the lessons and resources.

## 3. Assignments & Attendance
1. The instructor creates assignments via `POST /api/users/classes/assignments/class/:classId`.
2. Students submit work which is stored in `assignment_submissions`.
3. Attendance for each lesson is recorded through the `/attendance` endpoints.

## 4. Scoring
1. Instructors can define a scoring policy using `POST /api/users/classes/scores/policy/:classId`.
2. The policy sets weights for assignment grades, attendance and a final exam.
3. `GET /api/users/classes/scores/instructor/:classId` calculates scores for every enrolled student.
4. Each student's results are saved in `student_class_scores` with the total percentage and pass/fail status.

## 5. Certificates
1. When a student passes, the instructor issues a certificate with `POST /api/users/classes/scores/instructor/:classId/students/:studentId/issue`.
2. A new entry is created in `certificates` linked to the class and student.
3. Students can view or download their certificate from the dashboard once issued.

