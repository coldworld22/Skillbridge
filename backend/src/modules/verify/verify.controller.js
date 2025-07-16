const service = require("./verify.service");

exports.sendEmailOtp = async (req, res) => {
  const result = await service.sendOtp(req.user.id, "email");
  if (result.alreadyVerified) {
    res.json({ message: "Email already verified", verified: true });
  } else {
    res.json({ message: "Email OTP sent", code: result.code });
  }
};

exports.sendPhoneOtp = async (req, res) => {
  const result = await service.sendOtp(req.user.id, "phone");
  if (result.alreadyVerified) {
    res.json({ message: "Phone already verified", verified: true });
  } else {
    res.json({ message: "Phone OTP sent", code: result.code });
  }
};

exports.verifyEmailOtp = async (req, res) => {
  const { code } = req.body;
  const result = await service.verifyOtp(req.user.id, "email", code);
  if (result.alreadyVerified) {
    res.json({ message: "Email already verified" });
  } else {
    res.json({ message: "Email verified" });
  }
};

exports.verifyPhoneOtp = async (req, res) => {
  const { code } = req.body;
  const result = await service.verifyOtp(req.user.id, "phone", code);
  if (result.alreadyVerified) {
    res.json({ message: "Phone already verified" });
  } else {
    res.json({ message: "Phone verified" });
  }
};
