// src/services/authService.js
import api from "../api/api"; // FIXED path

export const registerUser = (userData) =>
  api.post("/auth/register", userData);



export const loginUser = async (credentials) => {
  try {
    const response = await api.post("/auth/login", credentials, {
      withCredentials: true, // Includes cookies (for refreshToken)
    });

    const { accessToken, user } = response.data;

    // ✅ Basic validation: make sure data exists
    if (!accessToken || !user || !user.id || !user.role) {
      throw new Error("Invalid login response. Please try again.");
    }

    // ✅ Clean user object if needed (optional, defensive)
    const safeUser = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      avatar_url: user.avatar_url,
      status: user.status,
    };

    // 🧠 Dev log (remove in production)
    console.log("✅ Secure loginUser():", { accessToken, role: user.role });

    return { accessToken, user: safeUser };
  } catch (error) {
    console.error("❌ loginUser() error:", error.response?.data || error.message);

    // Re-throw error to show toast on frontend
    throw new Error(
      error.response?.data?.error || "Login failed. Please check your credentials."
    );
  }
};

export const getCurrentUser = async () => {
  const res = await fetch("/api/auth/me", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // if you use cookies for auth
  });

  if (!res.ok) {
    throw new Error("Failed to fetch current user");
  }

  const user = await res.json();
  return { user };
};





export const logoutUser = () =>
  api.post("/auth/logout", {}, { withCredentials: true });

export const refreshToken = () =>
  api.get("/auth/refresh-token", { withCredentials: true });

export const requestOtp = (email) =>
  api.post("/auth/request-reset", { email });

export const verifyOtp = (email, code) =>
  api.post("/auth/verify-otp", { email, code });

export const resetPassword = (email, code, newPassword) =>
  api.post("/auth/reset-password", { email, code, new_password: newPassword });
