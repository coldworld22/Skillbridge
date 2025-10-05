// Controller for class enrollment operations
const { v4: uuidv4 } = require("uuid");
const catchAsync = require("../../../utils/catchAsync");
const { sendSuccess } = require("../../../utils/response");
const AppError = require("../../../utils/AppError");
const service = require("./classEnrollment.service");
const db = require("../../../config/database");
const paymentsService = require("../../payments/payments.service");
const { recordPlanCoveredPayment } = require("../../payments/helpers/planPayments");
const { getActiveStudentSubscription } = require("../../plans/subscription.helper");
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

    const activeSubscription = await getActiveStudentSubscription(user_id);
    const activePlanId = activeSubscription?.plan_id;
    const activeSubscriptionId = activeSubscription?.id;
    const includedPlans = Array.isArray(cls.included_plans) ? cls.included_plans : [];
    const coveredBySubscription =
      activePlanId && includedPlans.includes(activePlanId);

    if (coveredBySubscription) {
      await recordPlanCoveredPayment({
        trx,
        userId: user_id,
        itemId: classId,
        itemType: "class",
        amount: 0,
        currency: cls.currency || "USD",
      });
      await creditInstructorSubscription(
        "class",
        classId,
        activePlanId,
        trx,
        instructorDelta
      );
    } else if (Number(cls.price) > 0) {
      const payment = await trx("payments")
        .where({
          user_id,
          item_id: classId,
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

