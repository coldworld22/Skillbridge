const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/AppError");
const { sendSuccess } = require("../../utils/response");
const service = require("./payments.service");
const libraryService = require("../library/library.service");
const enrollmentService = require("../classes/enrollments/classEnrollment.service");
const tutorialEnrollmentService = require("../users/tutorials/enrollments/tutorialEnrollment.service");
const { v4: uuidv4 } = require("uuid");

exports.approveBankPayment = catchAsync(async (req, res) => {
  const payment = await service.getById(req.params.id);
  if (!payment) throw new AppError("Payment not found", 404);

  const updated = await service.update(req.params.id, {
    status: "completed",
    paid_at: new Date(),
  });

  if (payment.item_type === "book") {
    try {
      await libraryService.recordPurchase(
        payment.user_id,
        payment.item_id,
        payment.amount
      );
    } catch (err) {
      console.error("Failed to record book purchase:", err);
    }
  }

  if (payment.item_type === "class") {
    try {
      await enrollmentService.createEnrollment({
        id: uuidv4(),
        user_id: payment.user_id,
        class_id: payment.item_id,
        status: "enrolled",
      });
    } catch (err) {
      console.error("Failed to enroll after payment:", err);
    }
  }

  if (payment.item_type === "tutorial") {
    try {
      await tutorialEnrollmentService.createEnrollment({
        id: uuidv4(),
        user_id: payment.user_id,
        tutorial_id: payment.item_id,
        status: "enrolled",
      });
    } catch (err) {
      console.error("Failed to enroll in tutorial after payment:", err);
    }
  }

  sendSuccess(res, updated, "Bank payment approved");
});

exports.rejectBankPayment = catchAsync(async (req, res) => {
  const payment = await service.getById(req.params.id);
  if (!payment) throw new AppError("Payment not found", 404);

  const updated = await service.update(req.params.id, {
    status: "rejected",
  });

  sendSuccess(res, updated, "Bank payment rejected");
});

