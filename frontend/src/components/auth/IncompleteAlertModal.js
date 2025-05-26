import { useEffect, useState } from "react";
import useAuthStore from "@/store/auth/authStore";
import { useRouter } from "next/router";

export default function IncompleteAlertModal() {
  const { user } = useAuthStore();
  const [show, setShow] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    // 🎯 Only show for Student or Instructor roles
    const isRelevantRole = user.role === "Student" || user.role === "Instructor";

    const needsProfile = !user.profile_complete || !user.is_email_verified || !user.is_phone_verified;

    if (isRelevantRole && needsProfile) {
      setShow(true);
    }
  }, [user]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg text-center max-w-md">
        <h2 className="text-xl font-semibold text-red-600 mb-2">Complete Your Profile</h2>
        <p className="text-gray-700 mb-4">
          You must verify your email and phone, and complete your profile before using the platform.
        </p>
        <button
          onClick={() => {
            const path = user.role === "Instructor"
              ? "/dashboard/instructor/profile/edit"
              : "/dashboard/student/profile/edit";
            router.push(path);
          }}

          className="bg-yellow-500 px-4 py-2 rounded text-gray-900 font-semibold"
        >
          Complete Now
        </button>
      </div>
    </div>
  );
}
