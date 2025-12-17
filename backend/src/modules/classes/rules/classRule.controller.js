const catchAsync = require("../../../utils/catchAsync");
const { sendSuccess } = require("../../../utils/response");
const service = require("./classRule.service");

exports.createRule = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  const rule = await service.createRule({ class_id: id, text });
  sendSuccess(res, rule, "Rule created");
});

exports.getRules = catchAsync(async (req, res) => {
  const rules = await service.getRules(req.params.id);
  sendSuccess(res, rules);
});

exports.updateRule = catchAsync(async (req, res) => {
  const { ruleId } = req.params;
  const rule = await service.updateRule(ruleId, req.body.text);
  sendSuccess(res, rule, "Rule updated");
});

exports.deleteRule = catchAsync(async (req, res) => {
  const { ruleId } = req.params;
  await service.deleteRule(ruleId);
  sendSuccess(res, null, "Rule deleted");
});
