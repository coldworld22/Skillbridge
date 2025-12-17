import { useRouter } from "next/router";
import { useState } from "react";
import { toast } from "react-toastify";
import useAuthStore from "@/store/auth/authStore";
import StudentLayout from "@/components/layouts/StudentLayout";
import AdminLayout from "@/components/layouts/AdminLayout";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import { FaUserCheck, FaComments, FaStar, FaChalkboardTeacher, FaVideo, FaCalendarAlt } from "react-icons/fa";
import { useTranslation } from "next-i18next";
import { IoMdTime } from "react-icons/io";
import BookingRequestModal from "@/components/student/instructors/BookingRequestModal";
import { fetchPublicInstructorById } from "@/services/public/instructorService";
import { fetchPublishedClasses } from "@/services/classService";
import { fetchPublishedTutorials } from "@/services/tutorialService";
import CustomVideoPlayer from "@/components/shared/CustomVideoPlayer";
import { safeEncodeURI } from "@/utils/url";
import styles from "./profile.module.scss";

export default function InstructorProfilePage({ initialInstructor, initialStats }) {
  const { t } = useTranslation("website");
  const router = useRouter();
  const { id } = router.query;
  const [instructor, setInstructor] = useState(initialInstructor);
  const [stats, setStats] = useState(initialStats);
  const [showBooking, setShowBooking] = useState(false);
  const { user } = useAuthStore();

  // Default to a relative path so the page works on any domain
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

  const openBooking = () => {
    if (!user || user.role?.toLowerCase() !== "student") {
      toast.info(
        "Please login as a student or create a student account to proceed."
      );
      return;
    }
    setShowBooking(true);
  };


  if (!instructor) return (
    <div className={styles.empty}>
      <h2 className={styles.emptyTitle}>Instructor not found</h2>
      <p>The requested instructor profile does not exist</p>
    </div>
  );

  const joinDate = instructor.created_at
    ? new Date(instructor.created_at).toLocaleDateString()
    : null;

  const role = user?.role?.toLowerCase();
  let Layout = StudentLayout;
  if (role === "instructor") {
    Layout = InstructorLayout;
  } else if (role === "admin" || role === "superadmin") {
    Layout = AdminLayout;
  }

  return (
    <Layout>
      <section className={styles.page}>
        <div className={styles.card}>
          <div className={styles.banner}>
            <div className={styles.avatarWrap}>
              <div className={styles.avatarBox}>
                <img
                  src={instructor.avatar_url}
                  className={styles.avatar}
                  alt={instructor.full_name}
                />
                <span
                  className={`${styles.statusDot} ${instructor.is_online ? styles.online : ""}`}
                ></span>
              </div>
            </div>
          </div>

          <div className={styles.body}>
            <div className={styles.textCenter}>
              <h1 className={styles.title}>{instructor.full_name}</h1>
              <div>
                <div className={styles.chips}>
                  {instructor.expertise?.map((item, index) => (
                    <span
                      key={index}
                      className={styles.chip}
                    >
                      {item}
                    </span>
                  ))}
                </div>

                {instructor.experience && (
                  <p className={styles.muted}>Experience: {instructor.experience} Years</p>
                )}
              </div>

              <div className={styles.stats}>
                <div className={styles.statItem}>
                  <FaChalkboardTeacher color="#fbbf24" /> {stats.classes} Classes
                </div>
                <div className={styles.statItem}>
                  <FaVideo color="#fbbf24" /> {stats.tutorials} Tutorials
                </div>
                {typeof instructor.rating === "number" && (
                  <div className={styles.statItem}>
                    <FaStar color="#fbbf24" /> {t('instructor_rating', { count: instructor.rating.toFixed(1) })}
                  </div>
                )}
                {joinDate && (
                  <div className={styles.statItem}>
                    <IoMdTime color="#fbbf24" /> Joined {joinDate}
                  </div>
                )}
              </div>
            </div>

            <div className={styles.divider} />

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>About Me</h2>
              {instructor.bio ? (
                <p className={styles.text} style={{ whiteSpace: "pre-line" }}>
                  {instructor.bio}
                </p>
              ) : (
                <p className={styles.italic}>No bio provided</p>
              )}
            </div>

            <div className={`${styles.infoGrid} ${styles.section}`}>
              {instructor.email && (
                <div className={styles.infoCard}>
                  <h3 className={styles.infoLabel}>Email</h3>
                  <p className={styles.infoValue}>{instructor.email}</p>
                </div>
              )}

              {instructor.phone && (
                <div className={styles.infoCard}>
                  <h3 className={styles.infoLabel}>Phone</h3>
                  <p className={styles.infoValue}>{instructor.phone}</p>
                </div>
              )}

              {instructor.pricing && (
                <div className={styles.infoCard}>
                  <h3 className={styles.infoLabel}>Pricing</h3>
                  <p className={styles.infoValue}>{instructor.pricing}</p>
                </div>
              )}
            </div>

            {instructor.demo_video_url && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Demo Video</h2>
                <div className={styles.video}>
                  <CustomVideoPlayer
                    videos={[{ src: safeEncodeURI(instructor.demo_video_url) }]}
                    storageKey={instructor?.id ? `instructor-profile-${instructor.id}` : undefined}
                  />
                </div>
              </div>
            )}

            <div className={styles.actions}>
              <button
                onClick={openBooking}
                className={`${styles.button} ${styles.primary}`}
              >
                <FaCalendarAlt /> Book Lesson
              </button>
              <button
                onClick={() => router.push(`/messages?userId=${instructor.id}`)}
                className={`${styles.button} ${styles.secondary}`}
              >
                <FaComments /> Chat Now
              </button>
            </div>
          </div>
        </div>

        {/* Booking Modal */}
        {showBooking && (
          <BookingRequestModal
            instructor={instructor}
            onClose={() => setShowBooking(false)}
          />
        )}
      </section>
    </Layout>
  );
}

export async function getServerSideProps({ params }) {
  const { id } = params;
  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";
    const data = await fetchPublicInstructorById(id);
    if (!data) {
      return { props: { initialInstructor: null, initialStats: { classes: 0, tutorials: 0 } } };
    }
    const resolvedAvatar = data?.avatar_url ? `${API_BASE_URL}${data.avatar_url}` : "/images/profile/user.png";
    const resolvedDemoVideo = data?.demo_video_url ? `${API_BASE_URL}${data.demo_video_url}` : null;
    const formatted = {
      ...data,
      name: data?.full_name ?? data?.name ?? "",
      avatar: resolvedAvatar,
      avatar_url: resolvedAvatar,
      demo_video_url: resolvedDemoVideo,
      availableNow: Boolean(data?.is_online),
    };

    const classRes = await fetchPublishedClasses();
    const classList = classRes?.data ?? classRes ?? [];
    const classCount = classList.filter((c) => String(c.instructor_id) === String(id)).length;

    const tutRes = await fetchPublishedTutorials();
    const tutList = tutRes?.data ?? tutRes ?? [];
    const tutCount = tutList.filter((t) => String(t.creator_id) === String(id)).length;

    return {
      props: {
        initialInstructor: formatted,
        initialStats: { classes: classCount, tutorials: tutCount },
      },
    };
  } catch (err) {
    console.error("Failed to load instructor", err);
    return { props: { initialInstructor: null, initialStats: { classes: 0, tutorials: 0 } } };
  }
}
