const logger = require('../../utils/logger.js');
const libraryService = require('../library/library.service');
const enrollmentService = require('../classes/enrollments/classEnrollment.service');
const tutorialEnrollmentService = require('../users/tutorials/enrollments/tutorialEnrollment.service');
const { v4: uuidv4 } = require('uuid');
const plansService = require('../plans/plans.service');
const subscriptionService = require('../subscriptions/subscription.service');
const classService = require('../classes/class.service');
const paymentsService = require('./payments.service');
const { STATUS } = paymentsService;
const cartService = require('../cart/cart.service');

exports.grantAccess = async (payment) => {
  try {
    if (payment.item_type === 'book') {
      await libraryService.recordPurchase(payment.user_id, payment.item_id, payment.amount);
    } else if (payment.item_type === 'class') {
      const cls = await classService.getClassById(payment.item_id);
      if (cls?.max_students) {
        const count = await enrollmentService.countEnrollments(payment.item_id);
        if (count >= cls.max_students) {
          await paymentsService.update(
            payment.id,
            {
              status: STATUS.AWAITING_APPROVAL,
            },
            payment.tenant_id || null
          );
          logger.warn(
            `Class ${payment.item_id} is at capacity. Payment ${payment.id} flagged for review`
          );
          return;
        }
      }

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

  try {
    const normalizedId =
      payment.item_id === undefined || payment.item_id === null
        ? payment.item_id
        : String(payment.item_id);
    await cartService.remove(payment.user_id, normalizedId, payment.item_type);
  } catch (err) {
    logger.error('Failed to clear cart item after payment:', err);
  }
};
