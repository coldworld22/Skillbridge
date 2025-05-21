const authService = require("./auth.service");

/**
 * Register a new user
 * @access Public
 */
exports.register = async (req, res) => {
  try {
    const result = await authService.registerUser(req.body);  // Calls registerUser in auth.service.js
    res.status(201).json(result);  // Send back accessToken, refreshToken, and user data
  } catch (err) {
    console.error(err);  // Log the error for debugging
    res.status(400).json({ error: err.message || "Registration failed" });
  }
};

/**
 * Authenticate user and issue access/refresh tokens
 * @access Public
 */
exports.login = async (req, res) => {
  try {
    const { accessToken, refreshToken, user } = await authService.loginUser(req.body);

    res
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      })
      .json({ accessToken, user }); // ✅ This response is perfect
  } catch (err) {
    console.error("Login failed:", err.message);
    res.status(401).json({ error: "Invalid credentials" });
  }
};



/**
 * Refresh access token using valid refresh token cookie
 * @access Public
 */
exports.refreshToken = (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ message: "Missing refresh token" });

    const decoded = authService.verifyRefreshToken(token);
    const accessToken = authService.generateAccessToken({
      id: decoded.id,
      role: decoded.role,
    });

    res.json({ accessToken });
  } catch (err) {
    console.error("Token refresh error:", err.message);
    res.status(403).json({ message: "Invalid or expired refresh token" });
  }
};


/**
 * Clear refresh token and logout user
 * @access Public
 */
exports.logout = (req, res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true, // Prevent client-side JS access
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    sameSite: "strict", // CSRF protection
  });

  res.json({ message: "Logged out successfully" });  // Respond with success message
};



/**
 * Request password reset (generate OTP and send it to user's email)
 * @access Public
 */
exports.requestReset = async (req, res) => {
  try {
    const { email } = req.body;  // Get email from request body
    await authService.generateOtp(email);  // Call service to generate OTP
    res.json({ message: "OTP sent to email" });
  } catch (err) {
    res.status(400).json({ error: err.message || "Failed to send OTP" });
  }
};

/**
 * Verify OTP sent to the user for password reset
 * @access Public
 */
exports.verifyOtp = async (req, res) => {
  try {
    const { email, code } = req.body;  // Get email and OTP code from request body
    const isValid = await authService.verifyOtp({ email, code });  // Verify OTP using the service
    res.json({ valid: isValid });
  } catch (err) {
    res.status(400).json({ error: err.message || "Invalid OTP" });
  }
};

/**
 * Reset user's password with valid OTP
 * @access Public
 */
exports.resetPassword = async (req, res) => {
  try {
    const { email, code, new_password } = req.body;  // Get email, OTP, and new password
    await authService.resetPassword({ email, code, new_password });  // Call the service to reset password
    res.json({ message: "Password reset successful" });
  } catch (err) {
    res.status(400).json({ error: err.message || "Failed to reset password" });
  }
};
