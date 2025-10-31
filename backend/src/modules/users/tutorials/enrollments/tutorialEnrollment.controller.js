const db = require("../../../../config/database");
const catchAsync = require("../../../../utils/catchAsync");
const AppError = require("../../../../utils/AppError");
const { sendSuccess } = require("../../../../utils/response");
const { v4: uuidv4 } = require("uuid");
const { requireUser, requireUserAndTutorial } = require("../utils");
const {
  getActiveStudentSubscription,
  getActiveStudentPlanId,
} = require("../../../plans/subscription.helper");
const { creditTutorialSubscription } = require("../../../payments/helpers/wallet");

// Enroll in tutorial
exports.enroll = catchAsync(async (req, res) => {
  const { userId, tutorialId } = requireUserAndTutorial(req);
  const user_id = userId;

  const tutorial = await db("tutorials").where({ id: tutorialId }).first();
  if (!tutorial) throw new AppError("Tutorial not found", 404);
  if (tutorial.moderation_status !== "Approved")
    throw new AppError("Tutorial not approved", 400);
  if (tutorial.status !== "published")
    throw new AppError("Tutorial not published", 400);

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
  const includedPlans = Array.isArray(tutorial.included_plans)
    ? tutorial.included_plans
    : [];
  const coveredBySubscription =
    activePlanId && includedPlans.includes(activePlanId);

  const id = uuidv4();

  const enroll = async (trx) => {
    const tutorialItemId =
      tutorialId === undefined || tutorialId === null
        ? tutorialId
        : String(tutorialId);
    if (coveredBySubscription && activeSubscriptionId) {
      const usage = await trx("plan_usage_metrics")
        .where({
          plan_id: activePlanId,
          subscription_id: activeSubscriptionId,
          item_type: "tutorial",
          item_id: tutorialItemId,
        })
        .first();

      if (usage) {
        await trx("plan_usage_metrics")
          .where({
            plan_id: activePlanId,
            subscription_id: activeSubscriptionId,
            item_type: "tutorial",
            item_id: tutorialItemId,
          })
          .update({ usage_count: usage.usage_count + 1 });
      } else {
        await trx("plan_usage_metrics").insert({
          plan_id: activePlanId,
          subscription_id: activeSubscriptionId,
          item_type: "tutorial",
          item_id: tutorialItemId,
          usage_count: 1,
        });
      }

      await creditTutorialSubscription(
        tutorialItemId,
        activePlanId,
        activeSubscriptionId,
        trx
      );

      await trx("payments").insert({
        user_id,
        item_id: tutorialItemId,
        item_type: "tutorial",
        source: "subscription",
        amount: 0,
      });
    } else if (coveredBySubscription) {
      await creditTutorialSubscription(
        tutorialItemId,
        activePlanId,
        trx
      );

      await trx("payments").insert({
        user_id,
        item_id: tutorialItemId,
        item_type: "tutorial",
        source: "subscription",
        amount: 0,
      });
    } else if (Number(tutorial.price) > 0) {
      const payment = await trx("payments")
        .where({
          user_id,
          item_type: "tutorial",
          item_id: tutorialItemId,
        })
        .first();
      if (!payment) throw new AppError("Payment required", 402);
      const hasPlan = payment.installments > 1;
      const isPaid = payment.status === "paid";
      if (!isPaid && !hasPlan) throw new AppError("Payment incomplete", 402);
    }

    await trx("tutorial_enrollments").insert({
      id,
      user_id,
      tutorial_id: tutorialId,
      status: "enrolled",
    });
  };

  try {
    if (db.transaction && !db.transaction.mock) {
      await db.transaction(enroll);
    } else {
      await enroll(db);
    }
  } catch (err) {
    if (err.code === "23505") {
      throw new AppError("Already enrolled", 409);
    }
    throw err;
  }

  sendSuccess(res, { id }, "Enrolled successfully");
});

// Mark as completed
exports.complete = catchAsync(async (req, res) => {
  const { userId, tutorialId } = requireUserAndTutorial(req);
  const user_id = userId;

  // Ensure enrollment exists
  const enrollment = await db("tutorial_enrollments")
    .where({ user_id, tutorial_id: tutorialId })
    .first();
  if (!enrollment) throw new AppError("Enrollment not found", 404);

  // Verify all chapters completed
  const [{ count: totalChapters }] = await db("tutorial_chapters")
    .where({ tutorial_id: tutorialId })
    .count("id as count");

  const [{ count: completedChapters }] = await db(
    "tutorial_chapter_completions as tcc"
  )
    .join("tutorial_chapters as tc", "tcc.chapter_id", "tc.id")
    .where("tc.tutorial_id", tutorialId)
    .andWhere("tcc.user_id", user_id)
    .count("tcc.id as count");

  const allChaptersCompleted =
    Number(totalChapters) === Number(completedChapters);

  const [{ count: totalAssignments }] = await db("tutorial_assignments")
    .where({ tutorial_id: tutorialId })
    .count("id as count");

  const [{ count: submittedAssignments }] = await db(
    "tutorial_assignment_submissions as tas"
  )
    .join("tutorial_assignments as ta", "tas.assignment_id", "ta.id")
    .where("ta.tutorial_id", tutorialId)
    .andWhere("tas.user_id", user_id)
    .count("tas.id as count");

  const allAssignmentsSubmitted =
    Number(totalAssignments) === Number(submittedAssignments);

  // Verify quiz passed if any
  let quizPassed = true;
  const quiz = await db("tutorial_quizzes")
    .where({ tutorial_id: tutorialId })
    .first();

  if (quiz) {
    const attempt = await db("quiz_attempts")
      .where({ tutorial_id: tutorialId, user_id, passed: true })
      .first();
    quizPassed = Boolean(attempt);
  }

  if (!allChaptersCompleted || !quizPassed || !allAssignmentsSubmitted) {
    throw new AppError(
      "Complete all chapters, assignments, and pass the required quiz before finishing the tutorial",
      400
    );
  }

  await db("tutorial_enrollments")
    .where({ user_id, tutorial_id: tutorialId })
    .update({ status: "completed", progress: 100 });

  sendSuccess(res, null, "Marked as completed");
});

// Get all enrolled tutorials for student
exports.getMyEnrollments = catchAsync(async (req, res) => {
  const user_id = requireUser(req);

  const rows = await db("tutorial_enrollments")
    .join("tutorials", "tutorials.id", "tutorial_enrollments.tutorial_id")
    .where("tutorial_enrollments.user_id", user_id)
    .select("tutorials.*", "tutorial_enrollments.status", "tutorial_enrollments.enrolled_at");

  sendSuccess(res, rows);
});

// Get enrollment status and progress for a tutorial
exports.getStatus = catchAsync(async (req, res) => {
  const { userId, tutorialId } = requireUserAndTutorial(req);
  const user_id = userId;

  const enrollment = await db("tutorial_enrollments")
    .where({ user_id, tutorial_id: tutorialId })
    .first();

  if (!enrollment) {
    return sendSuccess(res, { enrolled: false, progress: 0, status: null });
  }

  const progress =
    enrollment.progress != null
      ? Number(enrollment.progress)
      : enrollment.status === "completed"
      ? 100
      : 0;

  sendSuccess(res, {
    enrolled: true,
    status: enrollment.status,
    progress,
  });
});

// Update progress percentage for a tutorial
exports.updateProgress = catchAsync(async (req, res) => {
  const { userId, tutorialId } = requireUserAndTutorial(req);
  let { progress } = req.body;
  const user_id = userId;

  const enrollment = await db("tutorial_enrollments")
    .where({ user_id, tutorial_id: tutorialId })
    .first();
  if (!enrollment) throw new AppError("Enrollment not found", 404);

  // Clamp progress to [0, 100] to ensure valid range
  progress = Math.min(Math.max(Number(progress), 0), 100);

  await db("tutorial_enrollments")
    .where({ user_id, tutorial_id: tutorialId })
    .update({ progress });

  sendSuccess(res, { progress }, "Progress updated");
});
