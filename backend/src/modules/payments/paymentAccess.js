const logger = require('../../utils/logger.js');
const libraryService = require('../library/library.service');
const enrollmentService = require('../classes/enrollments/classEnrollment.service');
const tutorialEnrollmentService = require('../users/tutorials/enrollments/tutorialEnrollment.service');
const { v4: uuidv4 } = require('uuid');
const plansService = require('../plans/plans.service');
const subscriptionService = require('../subscriptions/subscription.service');

exports.grantAccess = async (payment) => {
  try {
    if (payment.item_type === 'book') {
      await libraryService.recordPurchase(payment.user_id, payment.item_id, payment.amount);
    } else if (payment.item_type === 'class') {
      await enrollmentService.createEnrollment({
        id: uuidv4(),
        user_id: payment.user_id,
        class_id: payment.item_id,
        status: 'enrolled',
      });
    } else if (payment.item_type === 'tutorial') {
      await tutorialEnrollmentService.createEnrollment({
        id: uuidv4(),
        user_id: payment.user_id,
        tutorial_id: payment.item_id,
        status: 'enrolled',
      });
    } else if (payment.item_type === 'plan') {
      const plan = await plansService.getPlanById(payment.item_id);
      if (plan) {
        const interval =
          Number(payment.amount) === Number(plan.price_yearly)
            ? 'yearly'
            : 'monthly';
        await subscriptionService.createOrRenewSubscription({
          user_id: payment.user_id,
          plan_id: payment.item_id,
          interval,
        });
      }
    }
  } catch (err) {
    logger.error('Failed to finalize enrollment after payment:', err);
  }
};
