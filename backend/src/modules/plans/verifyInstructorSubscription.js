const db = require("../../config/database");
const catchAsync = require("../../utils/catchAsync");

module.exports = catchAsync(async (req, res, next) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const subscription = await db("user_subscriptions as us")
    .join("plans as p", "us.plan_id", "p.id")
    .select(
      "us.id",
      "us.user_id",
      "us.plan_id",
      "us.start_date",
      "us.end_date",
      "us.status",
      "p.max_courses",
      "p.target_role",
      "p.slug"
    )
    .where("us.user_id", userId)
    .andWhere("us.status", "active")
    .andWhere(function () {
      this.whereNull("us.end_date").orWhere("us.end_date", ">", db.fn.now());
    })
    .first();

  if (!subscription || subscription.target_role !== "instructor") {
    return res
      .status(403)
      .json({ message: "Active instructor subscription required" });
  }

  if (subscription.max_courses !== null && subscription.max_courses !== undefined) {
    const [{ count }] = await db("online_classes")
      .where({ instructor_id: userId })
      .count("* as count");
    subscription.current_courses = Number(count);
    if (subscription.current_courses >= subscription.max_courses) {
      return res
        .status(403)
        .json({ message: "Maximum course limit reached" });
    }
  }

  req.subscription = subscription;
  next();
});

