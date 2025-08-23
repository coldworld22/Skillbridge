import { useEffect, useState } from "react";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import CalendarView from "@/components/shared/CalendarView";
import { fetchInstructorScheduleEvents } from "@/services/instructor/classService";
import useScheduleStore from "@/store/schedule/scheduleStore";
import { getLessonRoomLink } from "@/services/lessonService";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../next-i18next.config.js";

export default function InstructorSchedule() {
  const { t } = useTranslation(["dashboard", "common"], { keyPrefix: "schedulePage" });
  const { events, clear, addEvents, prunePastEvents } = useScheduleStore();

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchInstructorScheduleEvents();
        clear();
        addEvents(data);
        prunePastEvents();
      } catch (err) {
        console.error("Failed to load schedule", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [clear, addEvents, prunePastEvents]);



  return (
    <InstructorLayout>
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
                alert("Failed to start live session");
              }
              return;
            }
          }
          const sub = info.event.extendedProps?.subject;
          const student = info.event.extendedProps?.student;
          if (sub && student) {
            alert(`📚 ${sub}\n👤 Student: ${student}`);
          } else {
            alert(info.event.title);
          }
        }}
      />
      {loading && (
        <p className="text-center text-gray-500 mt-4">
          {t("loading", { ns: "common" })}
        </p>
      )}
      {!loading && events.length === 0 && (
        <p className="text-center text-gray-500 mt-4">{t("no_events")}</p>
      )}
    </InstructorLayout>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["dashboard", "common"], nextI18NextConfig)),
    },
  };
}
