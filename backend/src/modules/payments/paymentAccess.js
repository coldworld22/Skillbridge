const logger = require('../../utils/logger.js');
const libraryService = require('../library/library.service');
const enrollmentService = require('../classes/enrollments/classEnrollment.service');
const tutorialEnrollmentService = require('../users/tutorials/enrollments/tutorialEnrollment.service');
const { v4: uuidv4 } = require('uuid');

exports.grantAccess = async (payment) => {
  try {
    if (payment.item_type === 'book') {
      await libraryService.recordPurchase(payment.user_id, payment.item_id, payment.amount);
    } else if (payment.item_type === 'class') {
      const existing = await enrollmentService.findEnrollment(
        payment.user_id,
        payment.item_id
      );
      if (existing) {
        if (existing.status !== 'enrolled') {
          await enrollmentService.updateEnrollment(payment.user_id, payment.item_id, {
            status: 'enrolled',
          });
        }
      } else {
        await enrollmentService.createEnrollment({
          id: uuidv4(),
          user_id: payment.user_id,
          class_id: payment.item_id,
          status: 'enrolled',
        });
      }
    } else if (payment.item_type === 'tutorial') {
      await tutorialEnrollmentService.createEnrollment({
        id: uuidv4(),
        user_id: payment.user_id,
        tutorial_id: payment.item_id,
        status: 'enrolled',
      });
    }
  } catch (err) {
    logger.error('Failed to finalize enrollment after payment:', err);
  }
};
