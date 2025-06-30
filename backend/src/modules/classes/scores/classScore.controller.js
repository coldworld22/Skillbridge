const catchAsync = require('../../../utils/catchAsync');
const { sendSuccess } = require('../../../utils/response');
const service = require('./classScore.service');

exports.setPolicy = catchAsync(async (req, res) => {
  const policy = await service.setPolicy(req.params.classId, req.body);
  sendSuccess(res, policy, 'Scoring policy saved');
});

exports.listScores = catchAsync(async (req, res) => {
  const scores = await service.calculateForClass(req.params.classId);
  sendSuccess(res, scores);
});

exports.issueCertificate = catchAsync(async (req, res) => {
  const cert = await service.issueCertificate(req.params.classId, req.params.studentId);
  sendSuccess(res, cert, 'Certificate issued');
});

exports.getMyScore = catchAsync(async (req, res) => {
  const score = await service.calculateForStudent(req.params.classId, req.user.id);
  sendSuccess(res, score);
});
