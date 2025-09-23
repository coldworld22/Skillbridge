// components/auth/RequireProfileCompletion.js
import { useEffect } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import useAuthStore from "@/store/auth/authStore";
import profileRoutes from "@/constants/profileRoutes";
import { getPrimaryRole } from "@/utils/auth/roleUtils";

export default function RequireProfileCompletion({ children }) {
  const { user } = useAuthStore();
  const router = useRouter();
  const userRole = getPrimaryRole(user);

  useEffect(() => {
    if (user && user.profile_complete === false) {
      const targetPath = profileRoutes[userRole] || "/auth/login";

      // Avoid redirecting if already on the profile page
      if (router.pathname !== targetPath) {
        toast.info(
          "Please complete your profile (including expertise, bio, and pricing) to continue."
        );
        router.replace(targetPath);
      }
    }
  }, [user, userRole, router]);

  return <>{children}</>;
}
