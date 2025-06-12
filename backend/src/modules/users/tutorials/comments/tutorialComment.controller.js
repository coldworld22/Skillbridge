const db = require("../../../../config/database");
const catchAsync = require("../../../../utils/catchAsync");
const { sendSuccess } = require("../../../../utils/response");
const { v4: uuidv4 } = require("uuid");

// Post a comment
exports.createComment = catchAsync(async (req, res) => {
  const { tutorialId } = req.params;
  const { message, parent_id } = req.body;
  const user_id = req.user.id;

  const id = uuidv4();
  await db("tutorial_comments").insert({
    id,
    tutorial_id: tutorialId,
    user_id,
    message,
    parent_id: parent_id || null,
  });

  sendSuccess(res, { id }, "Comment posted");
});

// Get comments for a tutorial
exports.getComments = catchAsync(async (req, res) => {
  const { tutorialId } = req.params;

  const comments = await db("tutorial_comments")
    .join("users", "users.id", "tutorial_comments.user_id")
    .where("tutorial_comments.tutorial_id", tutorialId)
    .select(
      "tutorial_comments.*",
      "users.full_name",
      "users.avatar_url"
    )
    .orderBy("created_at", "asc");

  sendSuccess(res, comments, "Comments fetched");
});
