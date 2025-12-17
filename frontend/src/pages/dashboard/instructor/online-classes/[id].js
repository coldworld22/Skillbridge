import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation, Trans } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../next-i18next.config.js";
import { Tab } from "@headlessui/react";
import { FaVideo, FaClipboardList, FaUsers, FaBookOpen } from "react-icons/fa";
import LessonManager from "@/components/instructors/LessonManager";
import StudentAttendancePanel from "@/components/instructors/StudentAttendancePanel";
import ResourceUploadSection from "@/components/instructors/ResourceUploadSection";
import BreakoutRoomControl from "@/components/instructors/BreakoutRoomControl";
import CertificateIssuancePanel from "@/components/instructors/CertificateIssuancePanel";
import AssignmentManager from "@/components/instructors/AssignmentManager";
import StudentProgressPanel from "@/components/instructors/StudentProgressPanel";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import { fetchClassManagementData } from "@/services/instructor/classService";
import useAuthStore from "@/store/auth/authStore";
import withAuthProtection from "@/hooks/withAuthProtection";
import { formatDistanceToNow } from "date-fns";

const VideoCallScreen = dynamic(
  () => import("@/components/video-call/VideoCallScreen"),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[360px] items-center justify-center bg-gray-900 text-yellow-300">
        Launching instructor console…
      </div>
    ),
  },
);

const isClassLive = (classData) => classData?.scheduleStatus === "Ongoing";

const tabStyles = ({ selected }) =>
  `px-4 py-2 text-sm font-semibold rounded-full transition focus:outline-none ${
    selected
      ? "bg-yellow-500 text-gray-900 shadow"
      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
  }`;

const PanelWrapper = ({ children }) => (
  <div className="mt-6 bg-gray-900/80 border border-gray-800 rounded-2xl p-6 shadow-xl">
    {children}
  </div>
);

function InstructorClassRoom() {
  const router = useRouter();
  const { id } = router.query;
  const { t } = useTranslation("dashboard");
  const user = useAuthStore((state) => state.user);

  const [classData, setClassData] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [resources, setResources] = useState([]);
  const [currentLessonId, setCurrentLessonId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [breakoutManager, setBreakoutManager] = useState(null);

  const applyLessons = useCallback((list) => {
    setLessons(list);
    if (!list || list.length === 0) {
      setCurrentLessonId(null);
      return;
    }
    const now = new Date();
    const upcoming = list
      .filter((lesson) => lesson.start_time && new Date(lesson.start_time) >= now)
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))[0];
    setCurrentLessonId(upcoming ? upcoming.id : list[0].id);
  }, []);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchClassManagementData(id);
        if (!data) return;
        setClassData(data.class);
        applyLessons(data.lessons || []);
        setAssignments(data.assignments || []);
        setResources(data.resources || []);
      } catch (err) {
        console.error("Failed to load class data", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, applyLessons]);

  const live = useMemo(() => isClassLive(classData), [classData]);
  const upcomingLesson = useMemo(() => {
    if (!lessons.length) return null;
    const now = new Date();
    return lessons
      .filter((lesson) => lesson.start_time)
      .map((lesson) => ({
        ...lesson,
        start: new Date(lesson.start_time),
      }))
      .sort((a, b) => a.start - b.start)
      .find((lesson) => lesson.start >= now);
  }, [lessons]);

  const handleResourceCreated = (resource) => {
    setResources((prev) => [resource, ...prev]);
  };

  const handleResourceDeleted = (resourceId) => {
    setResources((prev) => prev.filter((res) => res.id !== resourceId));
  };

  const handleAssignmentsUpdate = useCallback((list) => {
    setAssignments(list);
  }, []);

  if (!id || (loading && !classData)) {
    return <div className="text-white p-10">{t("loading_class_data")}</div>;
  }

  if (!classData) {
    return <div className="text-red-400 p-10">{t("unable_to_load_class")}</div>;
  }

  return (
    <div className="bg-gray-950 min-h-screen text-white px-4 py-6 md:px-8">
      <button
        onClick={() => router.back()}
        className="text-sm text-yellow-400 hover:underline"
      >
        &larr; {t("back_to_classes")}
      </button>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 bg-gray-900/80 border border-gray-800 rounded-2xl p-6 shadow-xl">
          <h1 className="text-2xl font-bold text-yellow-400">{classData.title}</h1>
          <p className="text-sm text-gray-300 mt-1">
            {t("instructor_label")}: {classData.instructor}
          </p>
          {classData.start_date && (
            <p className="text-xs text-gray-400 mt-2">
              {t("class_starts_at", {
                date: new Date(classData.start_date).toLocaleString(
                  router?.locale || undefined
                ),
              })}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-3 text-xs uppercase tracking-wide">
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/40">
              {classData.scheduleStatus}
            </span>
            <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/40">
              {t("lesson_count", { count: lessons.length })}
            </span>
            <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/40">
              {t("assignment_count", { count: assignments.length })}
            </span>
            <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/40">
              {t("resource_count", { count: resources.length })}
            </span>
          </div>
          {upcomingLesson && (
            <div className="mt-4 text-sm text-gray-300">
              <Trans
                i18nKey="dashboard:next_lesson_in"
                values={{
                  title: upcomingLesson.title,
                  time: formatDistanceToNow(upcomingLesson.start, {
                    addSuffix: true,
                  }),
                }}
                components={{ strong: <strong /> }}
              />
            </div>
          )}
        </div>

        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-3">
          <h2 className="text-lg font-semibold text-yellow-300">
            {t("live_session_quick_actions")}
          </h2>
          <BreakoutRoomControl
            classId={id}
            userId={user?.id}
            userName={user?.full_name || user?.name || t("default_instructor_name")}
            userRole="host"
            manager={breakoutManager}
            participants={breakoutManager?.participants || []}
          />
        </div>
      </div>

      <Tab.Group as="div" className="mt-8">
        <Tab.List className="flex flex-wrap gap-3">
          <Tab className={tabStyles}>
            <span className="flex items-center gap-2">
              <FaVideo /> {t("tab_live_session")}
            </span>
          </Tab>
          <Tab className={tabStyles}>
            <span className="flex items-center gap-2">
              <FaClipboardList /> {t("tab_content")}
            </span>
          </Tab>
          <Tab className={tabStyles}>
            <span className="flex items-center gap-2">
              <FaUsers /> {t("tab_students")}
            </span>
          </Tab>
          <Tab className={tabStyles}>
            <span className="flex items-center gap-2">
              <FaBookOpen /> {t("tab_resources")}
            </span>
          </Tab>
        </Tab.List>

        <Tab.Panels className="mt-4">
          <Tab.Panel>
            <PanelWrapper>
              <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
                <div className="rounded-2xl overflow-hidden border-2 border-yellow-500 shadow-xl">
                  <VideoCallScreen
                    chatId={id}
                    userRole="host"
                    onBreakoutManagerReady={setBreakoutManager}
                  />
                </div>
                <div className="space-y-4">
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <h3 className="text-yellow-300 font-semibold mb-2">
                      {t("attendance_snapshot")}
                    </h3>
                    {lessons.length > 0 ? (
                      <>
                        <select
                          className="mb-3 w-full bg-gray-800 text-white p-2 rounded border border-gray-700"
                          value={currentLessonId || ""}
                          onChange={(e) => setCurrentLessonId(e.target.value)}
                        >
                          {lessons.map((lesson) => (
                            <option key={lesson.id} value={lesson.id}>
                              {lesson.title}
                            </option>
                          ))}
                        </select>
                        <StudentAttendancePanel lessonId={currentLessonId} />
                      </>
                    ) : (
                      <p className="text-gray-400 text-sm">
                        {t("attendance_empty_state")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </PanelWrapper>
          </Tab.Panel>

          <Tab.Panel>
            <PanelWrapper>
              <div className="grid gap-6 lg:grid-cols-2">
                <LessonManager
                  classId={id}
                  initialLessons={lessons}
                  onLessonsUpdate={applyLessons}
                />
                <AssignmentManager
                  classId={id}
                  assignments={assignments}
                  onAssignmentsUpdate={handleAssignmentsUpdate}
                />
              </div>
            </PanelWrapper>
          </Tab.Panel>

          <Tab.Panel>
            <PanelWrapper>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <h3 className="text-yellow-300 font-semibold mb-3">
                    {t("issue_certificates")}
                  </h3>
                  <CertificateIssuancePanel classId={id} />
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <h3 className="text-yellow-300 font-semibold mb-3">
                    {t("student_progress")}
                  </h3>
                  <StudentProgressPanel classId={id} />
                </div>
              </div>
            </PanelWrapper>
          </Tab.Panel>

          <Tab.Panel>
            <PanelWrapper>
              <ResourceUploadSection
                classId={id}
                isLive={live}
                resources={resources}
                onResourceCreated={handleResourceCreated}
                onResourceDeleted={handleResourceDeleted}
              />
            </PanelWrapper>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}

InstructorClassRoom.getLayout = function getLayout(page) {
  return <InstructorLayout>{page}</InstructorLayout>;
};

const ProtectedInstructorClassRoom = withAuthProtection(InstructorClassRoom, [
  "instructor",
]);
ProtectedInstructorClassRoom.getLayout = InstructorClassRoom.getLayout;
export default ProtectedInstructorClassRoom;
export { InstructorClassRoom };

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(
        locale,
        ["common", "dashboard"],
        nextI18NextConfig
      )),
    },
  };
}
