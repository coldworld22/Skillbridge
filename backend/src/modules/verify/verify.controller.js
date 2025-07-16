const service = require("./verify.service");

exports.sendEmailOtp = async (req, res) => {
  const code = await service.sendOtp(req.user.id, "email");
  res.json({ message: "Email OTP sent", code });
};

exports.sendPhoneOtp = async (req, res) => {
  const code = await service.sendOtp(req.user.id, "phone");
  res.json({ message: "Phone OTP sent", code });
};

exports.verifyEmailOtp = async (req, res) => {
  const { code } = req.body;
  await service.verifyOtp(req.user.id, "email", code);
  res.json({ message: "Email verified" });
};

exports.verifyPhoneOtp = async (req, res) => {
  const { code } = req.body;
  await service.verifyOtp(req.user.id, "phone", code);
  res.json({ message: "Phone verified" });
};
