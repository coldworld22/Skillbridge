// Controller for class enrollment operations
const { v4: uuidv4 } = require("uuid");
const catchAsync = require("../../../utils/catchAsync");
const { sendSuccess } = require("../../../utils/response");
const AppError = require("../../../utils/AppError");
const service = require("./classEnrollment.service");
const db = require("../../../config/database");
const paymentsService = require("../../payments/payments.service");
const {
  getActiveStudentSubscription,
  getActiveStudentPlanId,
} = require("../../plans/subscription.helper");
const { creditInstructorSubscription } = require("../../payments/helpers/wallet");

exports.enroll = catchAsync(async (req, res) => {
  const { classId } = req.params;
  const user_id = req.user.id;
  let result;

  await db.transaction(async (trx) => {
    const cls = await trx("online_classes")
      .where({ id: classId })
      .forUpdate()
      .first();
    if (!cls) throw new AppError("Class not found", 404);
    if (cls.status !== "published" || cls.moderation_status !== "Approved") {
      throw new AppError("Class is not available for enrollment", 400);
    }
    if (typeof cls.max_students === "number" && cls.max_students !== null) {
      const count = await service.countEnrollments(classId, trx);
      if (count >= cls.max_students) {
        throw new AppError("Class is full", 400);
      }
    }

    const exists = await service.findEnrollment(user_id, classId, trx);
    if (exists && exists.status !== "cancelled") {
      result = { data: exists, message: "Already enrolled" };
      return;
    }

    let activePlanId = null;
    let activeSubscriptionId = null;
    let activeSubscription = null;

    if (typeof getActiveStudentSubscription === "function") {
      try {
        activeSubscription = await getActiveStudentSubscription(user_id);
      } catch (_) {
        activeSubscription = null;
      }
    }

    if (activeSubscription) {
      activePlanId = activeSubscription.plan_id || null;
      activeSubscriptionId = activeSubscription.subscription_id || null;
    }

    if (!activePlanId && typeof getActiveStudentPlanId === "function") {
      try {
        activePlanId = await getActiveStudentPlanId(user_id);
      } catch (_) {
        activePlanId = null;
      }
    }
    let includedPlans = [];
    if (Array.isArray(cls.included_plans)) {
      includedPlans = cls.included_plans;
    } else if (cls.included_plans) {
      try {
        const parsed = JSON.parse(cls.included_plans);
        includedPlans = Array.isArray(parsed) ? parsed : [];
      } catch {
        includedPlans = [];
      }
    }
    const requiresPlan = cls.access_type === "free";
    const coveredBySubscription =
      activePlanId && includedPlans.includes(activePlanId);

    if (requiresPlan && !coveredBySubscription) {
      throw new AppError(
        "An active student plan that includes this class is required",
        403
      );
    }

    const classItemId =
      classId === undefined || classId === null ? classId : String(classId);

    if (coveredBySubscription && activeSubscriptionId) {
      const usage = await trx("plan_usage_metrics")
        .where({
          plan_id: activePlanId,
          subscription_id: activeSubscriptionId,
          item_type: "class",
          item_id: classItemId,
        })
        .first();

      if (usage) {
        await trx("plan_usage_metrics")
          .where({
            plan_id: activePlanId,
            subscription_id: activeSubscriptionId,
            item_type: "class",
            item_id: classItemId,
          })
          .update({ usage_count: usage.usage_count + 1 });
      } else {
        await trx("plan_usage_metrics").insert({
          plan_id: activePlanId,
          subscription_id: activeSubscriptionId,
          item_type: "class",
          item_id: classItemId,
          usage_count: 1,
        });
      }

      await trx("payments").insert({
        user_id,
        method_id: null,
        item_id: classItemId,
        item_type: "class",
        source: "subscription",
        status: paymentsService.STATUS.PAID,
        paid_at: new Date(),
        amount: 0,
      });
      // Credit the instructor for subscription-based enrollments so that
      // instructors are compensated when a class is taken via a plan.
      await creditInstructorSubscription(
        "class",
        classItemId,
        activePlanId,
        activeSubscriptionId,
        trx
      );
    } else if (coveredBySubscription) {
      await trx("payments").insert({
        user_id,
        method_id: null,
        item_id: classItemId,
        item_type: "class",
        source: "subscription",
        status: paymentsService.STATUS.PAID,
        paid_at: new Date(),
        amount: 0,
      });
      await creditInstructorSubscription(
        "class",
        classItemId,
        activePlanId,
        trx
      );
    } else if (Number(cls.price) > 0) {
      const payment = await trx("payments")
        .where({
          user_id,
          item_id: classItemId,
          item_type: "class",
          status: paymentsService.STATUS.PAID,
        })
        .first();
      if (!payment) {
        throw new AppError("Payment required", 400);
      }
    }

    if (exists && exists.status === "cancelled") {
      const enrolled_at = new Date();
      await service.updateEnrollment(
        user_id,
        classId,
        { status: "enrolled", enrolled_at },
        trx,
      );
      result = {
        data: { ...exists, status: "enrolled", enrolled_at },
        message: "Enrolled successfully",
      };
      return;
    }

    const data = {
      id: uuidv4(),
      user_id,
      class_id: classId,
      status: "enrolled",
    };
    await service.createEnrollment(data, trx);
    result = { data, message: "Enrolled successfully" };
  });

  sendSuccess(res, result.data, result.message);
});

exports.complete = catchAsync(async (req, res) => {
  const { classId } = req.params;
  await service.markCompleted(req.user.id, classId);
  sendSuccess(res, null, "Marked as completed");
});

exports.getMyEnrollments = catchAsync(async (req, res) => {
  const data = await service.getByUser(req.user.id);
  sendSuccess(res, data);
});

exports.getStudentsByClass = catchAsync(async (req, res) => {
  const data = await service.getByClass(req.params.id);
  sendSuccess(res, data);
});

exports.getStudent = catchAsync(async (req, res) => {
  const { classId, studentId } = req.params;
  const data = await service.getStudent(classId, studentId);
  sendSuccess(res, data);
});
