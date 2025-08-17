const catchAsync = require('../../utils/catchAsync');
const { sendSuccess } = require('../../utils/response');
const service = require('./ai.service');

exports.answer = catchAsync(async (req, res) => {
  const { provider, question, model } = req.body || {};
  if (!provider) {
    return res.status(400).json({ message: 'provider is required' });
  }
  if (!question) {
    return res.status(400).json({ message: 'question is required' });
  }
  const result = await service.answerWithAI(provider, question, model);
  if (result.error) {
    return res.status(400).json({ message: result.error });
  }
  sendSuccess(res, result);
});
