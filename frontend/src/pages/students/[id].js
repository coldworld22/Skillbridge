import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import useAuthStore from "@/store/auth/authStore";
import StudentLayout from "@/components/layouts/StudentLayout";
import AdminLayout from "@/components/layouts/AdminLayout";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import { FaComments } from "react-icons/fa";
import { IoMdTime } from "react-icons/io";
import { fetchPublicStudentById } from "@/services/public/studentService";
import styles from "../instructors/profile.module.scss";

export default function PublicStudentProfile() {
  const router = useRouter();
  const { id } = router.query;
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  // Default to a relative path so the page works on any domain
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchPublicStudentById(id);
        const formatted = {
          ...data,
          avatar_url: data?.avatar_url
            ? `${API_BASE_URL}${data.avatar_url}`
            : "/images/profile/user.png",
        };
        setStudent(formatted);
      } catch (err) {
        console.error("Failed to load student", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return (
    <div className={styles.spinnerWrap}>
      <div className={styles.spinner} />
    </div>
  );

  if (!student) return (
    <div className={styles.empty}>
      <h2 className={styles.emptyTitle}>Student not found</h2>
      <p>The requested student profile does not exist</p>
    </div>
  );

  const joinDate = student.created_at
    ? new Date(student.created_at).toLocaleDateString()
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
              <img
                src={student.avatar_url}
                className={styles.avatar}
                alt={student.full_name}
              />
            </div>
          </div>
          <div className={styles.body}>
            <div className={styles.textCenter}>
              <h1 className={styles.title}>{student.full_name}</h1>
              {joinDate && (
                <div className={styles.stats} style={{ marginTop: "0.5rem" }}>
                  <div className={styles.statItem}>
                    <IoMdTime color="#fbbf24" /> Joined {joinDate}
                  </div>
                </div>
              )}
            </div>
            <div className={styles.divider} />
            <div className={styles.infoGrid}>
              {student.email && (
                <div className={styles.infoCard}>
                  <h3 className={styles.infoLabel}>Email</h3>
                  <p className={styles.infoValue}>{student.email}</p>
                </div>
              )}
              {student.phone && (
                <div className={styles.infoCard}>
                  <h3 className={styles.infoLabel}>Phone</h3>
                  <p className={styles.infoValue}>{student.phone}</p>
                </div>
              )}
              {student.education_level && (
                <div className={styles.infoCard}>
                  <h3 className={styles.infoLabel}>Education Level</h3>
                  <p className={styles.infoValue}>{student.education_level}</p>
                </div>
              )}
            </div>
            {Array.isArray(student.topics) && student.topics.length > 0 && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Topics of Interest</h2>
                <div className={styles.chips} style={{ justifyContent: "flex-start" }}>
                  {student.topics.map((topic, idx) => (
                    <span
                      key={idx}
                      className={styles.chip}
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {student.learning_goals && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Learning Goals</h2>
                <p className={styles.text} style={{ whiteSpace: "pre-line" }}>{student.learning_goals}</p>
              </div>
            )}
            <div className={styles.actions}>
              <button
                onClick={() => router.push(`/messages?userId=${student.id}`)}
                className={`${styles.button} ${styles.secondary}`}
              >
                <FaComments /> Chat Now
              </button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
