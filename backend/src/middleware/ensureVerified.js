// 📁 src/middleware/auth/ensureVerified.js
module.exports = (req, res, next) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!user.profile_complete) {
    return res.status(403).json({
      message: "Please complete your profile to access this feature.",
    });
  }

  if (!user.is_email_verified) {
    return res.status(403).json({
      message: "Please verify your email to access this feature.",
    });
  }

  next();
};
