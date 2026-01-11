const QUOTA_ERROR_STATUS = 429;
const QUOTA_ERROR_CODE = "quota_exceeded";
const QUOTA_ERROR_MESSAGE = "Quota exceeded for current plan.";

const sendQuotaExceeded = (res, details = {}) => {
  return res.status(QUOTA_ERROR_STATUS).json({
    error: QUOTA_ERROR_CODE,
    message: QUOTA_ERROR_MESSAGE,
    ...details,
  });
};

module.exports = {
  QUOTA_ERROR_STATUS,
  QUOTA_ERROR_CODE,
  QUOTA_ERROR_MESSAGE,
  sendQuotaExceeded,
};
