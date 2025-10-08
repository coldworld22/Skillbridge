// 📁 src/services/profileService.js
import api from "../api/api";

// ────────────────────────────────
// 🔍 Get Full Profile (user + role-specific + social links)
// ────────────────────────────────
export const getFullProfile = () =>
    api.get("/users/me/full-profile", { withCredentials: true });

// ────────────────────────────────
// 📋 Complete Profile (JSON payload)
// ────────────────────────────────
export const updateProfile = (formData) =>
    api.put("/users/me/complete-profile", formData, {
        withCredentials: true,
        headers: {
            "Content-Type": "application/json",
        },
    });

// ────────────────────────────────
// ⬆️ Upload Avatar Image (Base64 not needed here; raw file only)
// ────────────────────────────────
export const uploadAvatar = (userId, formDataWithFile) =>
    api.patch(`/users/${userId}/avatar`, formDataWithFile, {
        withCredentials: true,
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });

// ────────────────────────────────
// 🎥 Upload Demo Video for Instructors
// ────────────────────────────────
export const uploadDemoVideo = (userId, formDataWithVideo) =>
    api.patch(`/users/${userId}/demo-video`, formDataWithVideo, {
        withCredentials: true,
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
