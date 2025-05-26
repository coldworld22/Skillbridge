// 📁 src/middleware/auth/ensureVerified.js
module.exports = (req, res, next) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!user.is_email_verified || !user.is_phone_verified) {
    return res.status(403).json({
      message: "Please verify your email and phone to access this feature.",
    });
  }

  next();
};
