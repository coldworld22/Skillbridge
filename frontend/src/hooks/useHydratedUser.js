import { useEffect } from "react";
import useAuthStore from "@/store/auth/authStore";

export default function useHydratedUser() {
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  useEffect(() => {
    if (user && hasHydrated) return;

    try {
      const raw = localStorage.getItem("auth");
      if (!raw) {
        if (!hasHydrated) {
          useAuthStore.setState({ hasHydrated: true });
        }
        return;
      }
      const parsed = JSON.parse(raw)?.state;
      if (parsed?.user) {
        useAuthStore.setState({
          user: parsed.user,
          accessToken: parsed.accessToken,
          hasHydrated: true,
        });
      } else if (!hasHydrated) {
        useAuthStore.setState({ hasHydrated: true });
      }
    } catch (err) {
      console.error("Failed to parse auth from localStorage", err);
      localStorage.removeItem("auth");
      useAuthStore.setState({ hasHydrated: true });
    }
  }, [user, hasHydrated]);

  return { user, hasHydrated };
}

