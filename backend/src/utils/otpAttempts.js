const redisClient = require("./redisClient");
const logger = require("./logger");

const OTP_ATTEMPT_PREFIX = "otpAttempt:";
const OTP_MAX_ATTEMPTS = 5;
const OTP_LOCK_TIME = 15 * 60 * 1000; // 15 minutes

function getOtpAttemptKey(identifier) {
  return `${OTP_ATTEMPT_PREFIX}${identifier}`;
}

async function recordFailedOtpAttempt(identifier) {
  if (!redisClient) return;
  const key = getOtpAttemptKey(identifier);
  let info = { count: 0, lockUntil: null };
  try {
    const data = await redisClient.get(key);
    if (data) info = JSON.parse(data);
    info.count += 1;
    if (info.count >= OTP_MAX_ATTEMPTS) {
      info.lockUntil = Date.now() + OTP_LOCK_TIME;
    }
    await redisClient.set(key, JSON.stringify(info), { PX: OTP_LOCK_TIME });
  } catch (err) {
    logger.error("Failed to record OTP attempt", err);
  }
}

async function clearOtpAttempts(identifier) {
  if (!redisClient) return;
  try {
    await redisClient.del(getOtpAttemptKey(identifier));
  } catch (err) {
    logger.error("Failed to clear OTP attempts", err);
  }
}

module.exports = {
  redisClient,
  logger,
  getOtpAttemptKey,
  recordFailedOtpAttempt,
  clearOtpAttempts,
};
