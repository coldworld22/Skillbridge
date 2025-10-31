import { useEffect, useState } from "react";
import useAuthStore from "@/store/auth/authStore";
import { useRouter } from "next/router";

export default function IncompleteAlertModal() {
  const { user } = useAuthStore();
  const [show, setShow] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    // 🎯 Only show for Student role (instructors no longer need profile completion modal)
    const isRelevantRole = user.role === "Student";

    const needsProfile = !user.profile_complete || !user.is_email_verified;

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
          Please complete your profile details and verify your email before using the platform.
        </p>
        <button
          onClick={() => {
            router.push("/dashboard/student/profile/edit");
          }}

          className="bg-yellow-500 px-4 py-2 rounded text-gray-900 font-semibold"
        >
          Complete Now
        </button>
      </div>
    </div>
  );
}
