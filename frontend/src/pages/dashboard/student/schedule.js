import { useEffect, useState } from "react";
import StudentLayout from "@/components/layouts/StudentLayout";
import CalendarView from "@/components/shared/CalendarView";
import { fetchStudentBookings } from "@/services/student/bookingService";
import { getLessonRoomLink } from "@/services/lessonService";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../next-i18next.config.js";

export default function StudentSchedule() {
  const { t } = useTranslation("dashboard", {
    keyPrefix: "studentSchedulePage",
  });
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const bookings = await fetchStudentBookings();
        const approved = bookings.filter((b) => b.status === "approved");
        const mapped = approved.map((b) => ({
          id: b.id,
          title: `${b.subject || "Lesson"} with ${b.instructor_name}`,
          start: b.start_time,
          end: b.end_time,
          extendedProps: {
            subject: b.subject || "Lesson",
            instructor: b.instructor_name,
          },
        }));
        setEvents(mapped);
      } catch (err) {
        console.error("Failed to load bookings", err);
      }
    };

    load();
  }, []);

  return (
    <StudentLayout>
      <CalendarView
        title={t("title")}
        events={events}
        onEventClick={async (info) => {
          const id = info.event.id || "";
          if (id.startsWith("lesson-")) {
            const lessonId = id.replace("lesson-", "");
            const start = new Date(info.event.start);
            const end = new Date(start.getTime() + 60 * 60 * 1000);
            const now = new Date();
            if (now >= start && now <= end) {
              try {
                const url = await getLessonRoomLink(lessonId);
                window.open(url, "_blank");
              } catch (err) {
                alert(t("failed_live_session"));
              }
              return;
            }
          }
          alert(
            t("event_alert", {
              subject: info.event.extendedProps.subject,
              instructor: info.event.extendedProps.instructor,
            })
          );
        }}
      />
    </StudentLayout>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["dashboard"], nextI18NextConfig)),
    },
  };
}
