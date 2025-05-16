// src/mock/rolesPermissionsMock.js

export const roles = [
    { id: 1, name: "Super Admin" },
    { id: 2, name: "Admin" },
    { id: 3, name: "Instructor" },
    { id: 4, name: "Student" },
  ];
  
  export const permissions = [
    "create_user",
    "view_user",
    "edit_user",
    "delete_user",
    "create_course",
    "edit_course",
    "delete_course",
    "create_lesson",
    "edit_lesson",
    "delete_lesson",
    "create_assignment",
    "grade_assignment",
    "submit_assignment",
    "generate_certificate",
    "view_certificate",
    "revoke_certificate",
    "view_class_analytics",
    "view_student_progress",
  ];
  
  export const rolePermissions = {
    1: permissions, // Super Admin
    2: permissions.filter((p) => !["delete_user", "delete_course", "revoke_certificate"].includes(p)),
    3: ["create_course", "edit_course", "create_lesson", "edit_lesson", "create_assignment", "grade_assignment", "view_class_analytics"],
    4: ["submit_assignment", "view_certificate", "view_course"],
  };
  