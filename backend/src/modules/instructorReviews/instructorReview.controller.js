const db = require("../../config/database");
const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const AppError = require("../../utils/AppError");

const normalizeRating = (value) => {
  const rating = Number(value);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new AppError("Rating must be an integer between 1 and 5.", 400);
  }
  return rating;
};

const ensureInstructor = async (instructorId) => {
  const instructor = await db("users")
    .where({ id: instructorId })
    .andWhereRaw("LOWER(role) = ?", ["instructor"])
    .first("id");

  if (!instructor) {
    throw new AppError("Instructor not found.", 404);
  }
};

const ensureStudentHasRelationship = async (studentId, instructorId) => {
  const enrollment = await db("class_enrollments as ce")
    .join("online_classes as oc", "oc.id", "ce.class_id")
    .where("ce.user_id", studentId)
    .andWhere("oc.instructor_id", instructorId)
    .first("ce.id");

  if (!enrollment) {
    throw new AppError(
      "You can only review instructors you have taken classes with.",
      403
    );
  }
};

const mapInstructorReviewRow = (row) => ({
  id: row.id,
  type: "instructor",
  targetId: row.instructor_id,
  targetName: row.instructor_name,
  targetAvatar: row.instructor_avatar,
  rating: row.rating,
  comment: row.comment,
  created_at: row.created_at,
  updated_at: row.updated_at,
  instructor: {
    id: row.instructor_id,
    name: row.instructor_name,
    avatar: row.instructor_avatar,
  },
});

exports.listByInstructor = catchAsync(async (req, res) => {
  const { instructorId } = req.params;
  await ensureInstructor(instructorId);

  const reviews = await db("instructor_reviews as ir")
    .join("users as u", "u.id", "ir.student_id")
    .where("ir.instructor_id", instructorId)
    .orderBy("ir.created_at", "desc")
    .select(
      "ir.id",
      "ir.rating",
      "ir.comment",
      "ir.created_at",
      "ir.updated_at",
      "u.full_name as student_name",
      "u.avatar_url as student_avatar"
    );

  const data = reviews.map((row) => ({
    id: row.id,
    rating: row.rating,
    comment: row.comment,
    created_at: row.created_at,
    updated_at: row.updated_at,
    student: {
      name: row.student_name,
      avatar: row.student_avatar,
    },
  }));

  sendSuccess(res, data, "Instructor reviews fetched.");
});

exports.listByStudent = catchAsync(async (req, res) => {
  const studentId = req.user.id;

  const [classRows, instructorRows] = await Promise.all([
    db("class_reviews as cr")
      .join("online_classes as oc", "oc.id", "cr.class_id")
      .leftJoin("users as instr", "instr.id", "oc.instructor_id")
      .where("cr.user_id", studentId)
      .orderBy("cr.created_at", "desc")
      .select(
        "cr.id",
        "cr.rating",
        "cr.comment",
        "cr.created_at",
        "oc.id as class_id",
        "oc.slug as class_slug",
        "oc.title as class_title",
        "oc.cover_image as class_cover",
        "instr.id as instructor_id",
        "instr.full_name as instructor_name"
      ),
    db("instructor_reviews as ir")
      .join("users as u", "u.id", "ir.instructor_id")
      .where("ir.student_id", studentId)
      .orderBy("ir.updated_at", "desc")
      .select(
        "ir.id",
        "ir.rating",
        "ir.comment",
        "ir.created_at",
        "ir.updated_at",
        "u.id as instructor_id",
        "u.full_name as instructor_name",
        "u.avatar_url as instructor_avatar"
      ),
  ]);

  const classReviews = classRows.map((row) => ({
    id: row.id,
    type: "class",
    targetId: row.class_slug || row.class_id,
    targetName: row.class_title,
    targetAvatar: row.class_cover,
    rating: row.rating,
    comment: row.comment,
    created_at: row.created_at,
    updated_at: row.created_at,
    class: {
      id: row.class_id,
      slug: row.class_slug,
      title: row.class_title,
    },
    instructor: row.instructor_id
      ? {
          id: row.instructor_id,
          name: row.instructor_name,
        }
      : null,
  }));

  const instructorReviews = instructorRows.map(mapInstructorReviewRow);

  const data = [...classReviews, ...instructorReviews].sort(
    (a, b) =>
      new Date(b.updated_at || b.created_at) -
      new Date(a.updated_at || a.created_at)
  );

  sendSuccess(res, data, "Reviews fetched.");
});

exports.getEligibleInstructors = catchAsync(async (req, res) => {
  const studentId = req.user.id;

  const rows = await db("class_enrollments as ce")
    .join("online_classes as oc", "oc.id", "ce.class_id")
    .join("users as u", "u.id", "oc.instructor_id")
    .leftJoin(
      "instructor_reviews as ir",
      function joinReviews() {
        this.on("ir.instructor_id", "=", "u.id").andOn(
          "ir.student_id",
          "=",
          db.raw("?", [studentId])
        );
      }
    )
    .where("ce.user_id", studentId)
    .distinct("u.id", "u.full_name", "u.avatar_url", "ir.id as review_id");

  const data = rows.map((row) => ({
    id: row.id,
    name: row.full_name,
    avatar: row.avatar_url,
    review_id: row.review_id,
  }));

  sendSuccess(res, data, "Instructor options fetched.");
});

exports.submitReview = catchAsync(async (req, res) => {
  const studentId = req.user.id;
  const { instructor_id: instructorId, rating, comment } = req.body;

  if (!instructorId) {
    throw new AppError("Instructor ID is required.", 400);
  }
  if (studentId === instructorId) {
    throw new AppError("You cannot review yourself.", 400);
  }

  await ensureInstructor(instructorId);
  await ensureStudentHasRelationship(studentId, instructorId);
  const normalizedRating = normalizeRating(rating);

  const existing = await db("instructor_reviews")
    .where({ instructor_id: instructorId, student_id: studentId })
    .first("id");

  let review;
  if (existing) {
    [review] = await db("instructor_reviews")
      .where({ id: existing.id })
      .update(
        {
          rating: normalizedRating,
          comment: comment ?? existing.comment,
          updated_at: db.fn.now(),
        },
        "*"
      );
  } else {
    [review] = await db("instructor_reviews").insert(
      {
        instructor_id: instructorId,
        student_id: studentId,
        rating: normalizedRating,
        comment: comment ?? null,
      },
      "*"
    );
  }

  sendSuccess(res, review, existing ? "Review updated." : "Review created.");
});

exports.updateReview = catchAsync(async (req, res) => {
  const studentId = req.user.id;
  const { id } = req.params;
  const { rating, comment } = req.body;

  const review = await db("instructor_reviews")
    .where({ id })
    .first();

  if (!review || review.student_id !== studentId) {
    throw new AppError("Review not found.", 404);
  }

  const normalizedRating =
    rating === undefined ? review.rating : normalizeRating(rating);

  const [updated] = await db("instructor_reviews")
    .where({ id })
    .update(
      {
        rating: normalizedRating,
        comment: comment ?? review.comment,
        updated_at: db.fn.now(),
      },
      "*"
    );

  sendSuccess(res, updated, "Review updated.");
});

exports.deleteReview = catchAsync(async (req, res) => {
  const studentId = req.user.id;
  const { id } = req.params;

  const review = await db("instructor_reviews")
    .where({ id })
    .first();

  if (!review || review.student_id !== studentId) {
    throw new AppError("Review not found.", 404);
  }

  await db("instructor_reviews").where({ id }).del();
  sendSuccess(res, null, "Review deleted.");
});
