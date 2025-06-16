// 📁 src/utils/enums.js
// Central list of valid user roles
const ROLE_NAMES = ["Student", "Instructor", "Admin", "SuperAdmin"];
exports.ROLE_NAMES = ROLE_NAMES;

exports.ROLES = Object.freeze({
  STUDENT: "student",
  INSTRUCTOR: "instructor",
  ADMIN: "admin",
  SUPERADMIN: "superadmin",
});
exports.STATUS = Object.freeze({
  ACTIVE: "active",
  INACTIVE: "inactive",
  SUSPENDED: "suspended",
  BANNED: "banned",
  PENDING: "pending",
});
