// components/auth/RequireProfileCompletion.js
import { useEffect } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import useAuthStore from "@/store/auth/authStore";

const roleRedirects = {
  admin: "/dashboard/admin/profile/edit",
  instructor: "/dashboard/instructor/profile/edit",
  student: "/dashboard/student/profile/edit",
};

export default function RequireProfileCompletion({ children }) {
  const { user } = useAuthStore();
  const router = useRouter();
  const userRole = user?.role?.toLowerCase();

  useEffect(() => {
    if (!user) return;

    if (user.profile_complete === false) {
      const targetPath = roleRedirects[userRole] || "/profile/edit";
      if (router.pathname !== targetPath) {
        toast.info("Please complete your profile to continue.");
        router.replace(targetPath);
      }
      return;
    }

    if (!user.is_email_verified && router.pathname !== "/auth/verify-email") {
      toast.info("Verify your email to continue.");
      router.replace("/auth/verify-email");
    }
  }, [user, userRole, router]);

  return <>{children}</>;
}
