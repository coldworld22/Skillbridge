const logger = require('../../../utils/logger.js');
const notificationService = require('../../notifications/notifications.service');
const messageService = require('../../messages/messages.service');
const userModel = require('../user.model');
const {
  sendTutorialCreatedAdminEmail,
  sendTutorialCreatedInstructorEmail,
} = require('../../../utils/email');

/**
 * Send notifications, messages and emails after a tutorial is created.
 */
async function sendCreationNotifications(instructorId, title) {
  const instructor = await userModel.findById(instructorId);
  const admins = await userModel.findAdmins();

  const adminNotifications = admins.map((admin) =>
    notificationService.createNotification({
      user_id: admin.id,
      type: 'new_tutorial',
      message: `Instructor ${instructor.full_name} added new tutorial "${title}" waiting for review`,
    })
  );

  const adminMessages = admins.map((admin) =>
    messageService.createMessage({
      sender_id: instructorId,
      receiver_id: admin.id,
      message: `New tutorial "${title}" created by ${instructor.full_name} and awaiting your review`,
    })
  );

  await Promise.all([
    notificationService.createNotification({
      user_id: instructorId,
      type: 'tutorial_created',
      message:
        "New tutorial added successfully. It's under review and will be available after we approve it",
    }),
    ...adminNotifications,
    ...adminMessages,
    messageService.createMessage({
      sender_id: instructorId,
      receiver_id: instructorId,
      message: 'Your tutorial was submitted and is pending review',
    }),
    ...admins.map((admin) =>
      sendTutorialCreatedAdminEmail(admin.email, instructor.full_name, title)
    ),
  ]);

  try {
    await sendTutorialCreatedInstructorEmail(instructor.email, title);
  } catch (err) {
    logger.error('Error sending tutorial created email:', err.message);
  }
}

module.exports = { sendCreationNotifications };
