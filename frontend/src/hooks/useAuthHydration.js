// 📁 src/hooks/useAuthHydration.js
import useAuthStore from "@/store/auth/authStore";

export default function useAuthHydration() {
  return useAuthStore((state) => state.hasHydrated);
}
