export const markAsResolved = (discussion) => {
  return { ...discussion, status: "resolved" };
};

import logger from "@/utils/logger";

export const warnUser = (userId, reason) => {
  logger.warn(`Warned user ${userId} for reason: ${reason}`);
};

export const lockDiscussion = (discussionId) => {
  logger.warn(`Discussion ${discussionId} locked`);
};
