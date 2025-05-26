import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  getAdminProfile,
  updateAdminProfile,
  uploadAdminAvatar,
  uploadAdminIdentity,
  changeAdminPassword,
} from "@/services/admin/adminService";

const useAdminStore = create(
  persist(
    (set, get) => ({
      profile: null,
      isLoading: false,
      error: null,

      // ✅ Load admin profile
      fetchProfile: async () => {
        set({ isLoading: true, error: null });
        try {
          const data = await getAdminProfile();
          set({ profile: data, isLoading: false });
        } catch (err) {
          set({ error: err.message, isLoading: false });
        }
      },

      // ✅ Update admin profile
      updateProfile: async (profileData) => {
        set({ isLoading: true, error: null });
        try {
          const data = await updateAdminProfile(profileData);
          set({ profile: data, isLoading: false });
          return true;
        } catch (err) {
          set({ error: err.message, isLoading: false });
          return false;
        }
      },

      // ✅ Change password
      changePassword: async (adminId, newPassword) => {
        set({ isLoading: true, error: null });
        try {
          await changeAdminPassword(adminId, newPassword);
          set({ isLoading: false });
          return true;
        } catch (err) {
          set({ error: err.message, isLoading: false });
          return false;
        }
      },

      // ✅ Upload avatar
      uploadAvatar: async (adminId, file) => {
        set({ isLoading: true, error: null });
        try {
          const data = await uploadAdminAvatar(adminId, file);
          set((state) => ({
            profile: { ...state.profile, avatar_url: data.avatar_url },
            isLoading: false,
          }));
          return true;
        } catch (err) {
          set({ error: err.message, isLoading: false });
          return false;
        }
      },

      // ✅ Upload identity
      uploadIdentity: async (file) => {
        set({ isLoading: true, error: null });
        try {
          await uploadAdminIdentity(file);
          set({ isLoading: false });
          return true;
        } catch (err) {
          set({ error: err.message, isLoading: false });
          return false;
        }
      },

      // ✅ Reset store (logout or clear)
      clearAdmin: () => {
        set({ profile: null, isLoading: false, error: null });
      },
    }),
    {
      name: "admin-store",
    }
  )
);

export default useAdminStore;
