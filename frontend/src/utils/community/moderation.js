export const markAsResolved = (discussion) => {
  return { ...discussion, status: "resolved" };
};

export const warnUser = (userId, reason) => {
  console.warn(`Warned user ${userId} for reason: ${reason}`);
};

export const lockDiscussion = (discussionId) => {
  console.log(`Discussion ${discussionId} locked`);
};
