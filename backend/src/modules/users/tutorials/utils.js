const AppError = require('../../../utils/AppError');

exports.requireUser = (req) => {
  if (!req.user || !req.user.id) {
    throw new AppError('Authentication required', 401);
  }
  return req.user.id;
};

exports.requireUserAndTutorial = (req) => {
  const userId = exports.requireUser(req);
  const { tutorialId } = req.params;
  if (!tutorialId) {
    throw new AppError('Invalid tutorial ID', 400);
  }
  return { userId, tutorialId };
};

exports.requireValidTutorialId = (req) => {
  const { tutorialId } = req.params;
  if (!tutorialId) {
    throw new AppError('Invalid tutorial ID', 400);
  }
  return tutorialId;
};
