import { useEffect, useState } from "react";
import useAuthStore from "@/store/auth/authStore";
import { useRouter } from "next/router";
import modalStyles from "@/components/common/Modal.module.scss";
import { Button } from "@/components/ui/button";

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
    <div className={modalStyles.simpleOverlay}>
      <div className={modalStyles.panel} style={{ textAlign: "center", maxWidth: "28rem" }}>
        <h2 className={`${modalStyles.title} ${modalStyles.dangerTitle}`}>Complete Your Profile</h2>
        <p className={modalStyles.muted}>
          Please complete your profile details and verify your email before using the platform.
        </p>
        <div className={modalStyles.ctaRow} style={{ justifyContent: "center" }}>
          <Button
            variant="accent"
            onClick={() => router.push("/dashboard/student/profile/edit")}
          >
            Complete Now
          </Button>
        </div>
      </div>
    </div>
  );
}
