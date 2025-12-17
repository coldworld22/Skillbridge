const { v4: uuidv4 } = require("uuid");
const enrollmentService = require("../../classes/enrollments/classEnrollment.service");
const tutorialEnrollmentService = require("../../users/tutorials/enrollments/tutorialEnrollment.service");
const logger = require("../../../utils/logger.js");

async function handleEnrollment(item_type, user_id, item_id) {
  try {
    if (item_type === "class") {
      const existingEnrollment = await enrollmentService.findEnrollment(
        user_id,
        item_id
      );
      if (existingEnrollment) {
        if (existingEnrollment.status !== "enrolled") {
          await enrollmentService.updateEnrollment(user_id, item_id, {
            status: "enrolled",
          });
        }
      } else {
        await enrollmentService.createEnrollment({
          id: uuidv4(),
          user_id,
          class_id: item_id,
          status: "enrolled",
        });
      }
    } else if (item_type === "tutorial") {
      await tutorialEnrollmentService.createEnrollment({
        id: uuidv4(),
        user_id,
        tutorial_id: item_id,
        status: "enrolled",
      });
    }
  } catch (err) {
    logger.error("Failed to enroll after payment:", err);
  }
}

module.exports = { handleEnrollment };
