// pages/dashboard/student/class/[id].js
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { FaVideo, FaCheckCircle } from 'react-icons/fa';
import { format, formatDistanceToNow } from 'date-fns';
import StudentScoreSummary from "@/components/students/StudentScoreSummary";
import {
  fetchClassDetails,
  fetchClassLessons,
  fetchClassAssignments,
} from "@/services/classService";
import { computeScheduleStatus } from "@/utils/classSchedule";
import { fetchClassResources } from "@/services/classResourceService";
import withAuthProtection from "@/hooks/withAuthProtection";
import { fetchSessionStatus } from "@/services/videoCallService";
import StudentLayout from "@/components/layouts/StudentLayout";
import nextI18NextConfig from "../../../../../next-i18next.config";

const LiveCallLoading = () => {
  const { t } = useTranslation("dashboard");
  return (
    <div className="bg-gray-900 text-center text-yellow-300 py-12">
      {t("student_online_class.live_connecting")}
    </div>
  );
};

const VideoCallScreen = dynamic(
  () => import('@/components/video-call/VideoCallScreen'),
  {
    ssr: false,
    loading: () => <LiveCallLoading />,
  },
);

function StudentClassRoom() {
  const router = useRouter();
  const { id } = router.query;
  const { t } = useTranslation("dashboard");
  const [classData, setClassData] = useState(null);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [scheduleStatus, setScheduleStatus] = useState(null);
  const [resources, setResources] = useState([]);
  const [liveStatus, setLiveStatus] = useState({ live: false, reportedAt: null });
  const [checkingLive, setCheckingLive] = useState(true);
  const [sectionErrors, setSectionErrors] = useState({
    lessons: false,
    assignments: false,
    resources: false,
  });
  const parseDate = useCallback((value) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }, []);
  const formatRelativeTime = useCallback(
    (value, fallback = null) => {
      const date = parseDate(value);
      if (!date) return fallback;
      try {
        return formatDistanceToNow(date, { addSuffix: true });
      } catch {
        return fallback;
      }
    },
    [parseDate],
  );
  const formatAssignmentDueDate = useCallback(
    (assignment) => {
      const raw =
        assignment?.dueDate ??
        assignment?.due_date ??
        assignment?.dueOn ??
        assignment?.due_on;
      const date = parseDate(raw);
      return date ? format(date, 'MMM d, yyyy') : t("student_online_class.assignment_due_tba");
    },
    [parseDate, t],
  );
  const isAssignmentNew = useCallback(
    (assignment) => {
      const created = assignment?.createdAt ?? assignment?.created_at;
      const createdDate = parseDate(created);
      if (!createdDate) return false;
      return Date.now() - createdDate.getTime() < 3 * 24 * 60 * 60 * 1000;
    },
    [parseDate],
  );

  const isLive = useMemo(() => {
    if (liveStatus?.live) return true;
    return scheduleStatus === 'Ongoing';
  }, [liveStatus, scheduleStatus]);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setCompletedLessons([]);
    setAssignments([]);
    setResources([]);
    setSectionErrors({
      lessons: false,
      assignments: false,
      resources: false,
    });

    const load = async () => {
      try {
        const details = await fetchClassDetails(id);
        if (!active) return;

        if (!details) {
          setClassData(null);
          setScheduleStatus(null);
          return;
        }

        const status = computeScheduleStatus(details.startDate, details.endDate);
        const existingLessons = Array.isArray(details.lessons) ? details.lessons : [];
        setClassData({
          ...details,
          lessons: existingLessons,
          scheduleStatus: status,
        });
        setScheduleStatus(status);
      } catch (err) {
        if (active) {
          console.error('Failed to load class details', err);
          setClassData(null);
          setScheduleStatus(null);
        }
        return;
      }

      try {
        const [lessonsResult, assignmentsResult, resourcesResult] = await Promise.allSettled([
          fetchClassLessons(id),
          fetchClassAssignments(id),
          fetchClassResources(id),
        ]);

        if (!active) return;

        if (lessonsResult.status === 'fulfilled') {
          const normalizedLessons = Array.isArray(lessonsResult.value) ? lessonsResult.value : [];
          setSectionErrors((prev) => ({ ...prev, lessons: false }));
          setClassData((prev) =>
            prev ? { ...prev, lessons: normalizedLessons } : prev,
          );
        } else {
          console.error('Failed to load lessons', lessonsResult.reason);
          setSectionErrors((prev) => ({ ...prev, lessons: true }));
          setClassData((prev) =>
            prev ? { ...prev, lessons: [] } : prev,
          );
        }

        if (assignmentsResult.status === 'fulfilled') {
          const assignmentsData = Array.isArray(assignmentsResult.value)
            ? assignmentsResult.value
            : [];
          setSectionErrors((prev) => ({ ...prev, assignments: false }));
          setAssignments(assignmentsData);
        } else {
          console.error('Failed to load assignments', assignmentsResult.reason);
          setSectionErrors((prev) => ({ ...prev, assignments: true }));
          setAssignments([]);
        }

        if (resourcesResult.status === 'fulfilled') {
          const resourcesData = Array.isArray(resourcesResult.value)
            ? resourcesResult.value
            : [];
          setSectionErrors((prev) => ({ ...prev, resources: false }));
          setResources(resourcesData);
        } else {
          console.error('Failed to load resources', resourcesResult.reason);
          setSectionErrors((prev) => ({ ...prev, resources: true }));
          setResources([]);
        }
      } catch (err) {
        console.error('Failed to load supplemental class data', err);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [id]);

  const refreshLiveStatus = useCallback(async () => {
    if (!id) return;
    setCheckingLive(true);
    try {
      const status = await fetchSessionStatus(id);
      setLiveStatus(status);
    } catch (err) {
      setLiveStatus((prev) => ({ ...prev, live: false }));
    } finally {
      setCheckingLive(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const loadStatus = async () => {
      try {
        const status = await fetchSessionStatus(id);
        if (!cancelled) {
          setLiveStatus(status);
        }
      } catch (err) {
        if (!cancelled) {
          setLiveStatus((prev) => ({ ...prev, live: false }));
        }
      } finally {
        if (!cancelled) setCheckingLive(false);
      }
    };

    loadStatus();
    const interval = setInterval(loadStatus, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [id]);

  const markComplete = (index) => {
    setCompletedLessons((prev) => [...new Set([...prev, index])]);
  };

  const showCertificate =
    classData &&
    Array.isArray(classData.lessons) &&
    classData.lessons.length > 0 &&
    completedLessons.length === classData.lessons.length;

  if (!id) return <div className="text-white p-10">{t("loading_class_data")}</div>;
  if (!classData) return <div className="text-red-400 p-10">❌ {t("class_not_found")}</div>;

  return (
    <div className="bg-gray-900 min-h-screen text-white px-4 py-8">
      <h1 className="text-2xl font-bold text-yellow-400 mb-4">🎓 {classData.title}</h1>
      <p className="text-sm text-gray-400 mb-2">
        {t("instructor_label")}: {classData.instructor}
      </p>
      {scheduleStatus && (
        <p className="text-xs text-gray-400 mb-4">
          {t("student_online_class.status_label")}: {scheduleStatus}
        </p>
      )}

      {/* Progress Bar */}
      <div className="w-full bg-gray-700 rounded-full h-4 mb-6">
        <div
          className="bg-yellow-500 h-4 rounded-full"
          style={{ width: `${classData.lessons ? (completedLessons.length / classData.lessons.length) * 100 : 0}%` }}
        />
      </div>

      {/* Live Class Room */}
      <div className="mb-10 rounded-xl overflow-hidden shadow-lg border-2 border-yellow-500">
        {isLive ? (
          <VideoCallScreen chatId={id} />
        ) : (
          <div className="bg-yellow-800 text-white text-center p-6 rounded-lg shadow space-y-2">
            <p>⏳ {t("student_online_class.not_live_yet")}</p>
            <p className="text-sm text-yellow-200">
              {checkingLive
                ? t("student_online_class.checking_host")
                : t("student_online_class.last_checked", {
                    time: formatRelativeTime(
                      liveStatus?.reportedAt,
                      t("student_online_class.moment_ago")
                    ),
                  })}
            </p>
            {!checkingLive && (
              <button
                type="button"
                onClick={refreshLiveStatus}
                className="mt-2 inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-sm"
              >
                <FaVideo /> {t("student_online_class.refresh_status")}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Lessons Sidebar */}
      <div className="bg-gray-800 rounded-lg p-6 shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">📚 {t("student_online_class.lessons_title")}</h2>
        {sectionErrors.lessons && (
          <p className="text-sm text-red-300 mb-3">
            {t("student_online_class.lessons_error")}
          </p>
        )}
        <ul className="space-y-3">
          {(classData.lessons || []).map((lesson, i) => (
            <li
              key={i}
              className="flex justify-between items-center bg-gray-700 px-4 py-2 rounded hover:bg-gray-600 transition"
            >
              <div>
                <p>{i + 1}. {lesson.title}</p>
                <small className="text-gray-400">
                  {t("student_online_class.lesson_duration")}: {lesson.duration}
                </small>
              </div>
              {completedLessons.includes(i) ? (
                <FaCheckCircle className="text-green-400 text-xl" />
              ) : (
                <button
                  onClick={() => markComplete(i)}
                  className="text-sm text-yellow-300 hover:underline"
                >
                  {t("student_online_class.mark_complete")}
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Assignments Section */}
      <div className="bg-gray-800 rounded-lg p-6 shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">📜 {t("student_online_class.assignments_title")}</h2>
        {sectionErrors.assignments && (
          <p className="text-sm text-red-300 mb-3">
            {t("student_online_class.assignments_error")}
          </p>
        )}
        {assignments.length === 0 ? (
          <p className="text-gray-400">{t("student_online_class.no_assignments")}</p>
        ) : (
          <ul className="space-y-4">
            {assignments.map((assignment) => (
              <li key={assignment.id} className="flex justify-between items-center bg-gray-700 px-4 py-3 rounded hover:bg-gray-600">
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="font-semibold">{assignment.title}</p>
                    {isAssignmentNew(assignment) && (
                      <span className="bg-green-500 text-black text-xs px-2 py-0.5 rounded">
                        {t("student_online_class.assignment_new_badge")}
                      </span>
                    )}
                  </div>
                  <small className="text-gray-400">
                    {t("student_online_class.assignment_due", {
                      date: formatAssignmentDueDate(assignment),
                    })}
                  </small>
                </div>
                <div>
                  {assignment.status === 'Pending' ? (
                    <button
                      onClick={() => router.push(`/dashboard/student/assignments/${assignment.id}`)}
                      className="text-sm bg-yellow-500 text-black px-4 py-2 rounded hover:bg-yellow-600"
                    >
                      {t("student_online_class.assignment_start")}
                    </button>
                  ) : (
                    <span className="text-xs text-green-400 font-semibold">{assignment.status}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Final Score */}
      <div className="bg-gray-800 rounded-lg p-6 shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">🏆 {t("student_online_class.final_score_title")}</h2>
        <StudentScoreSummary classId={id} />
      </div>

      {/* Certificate Message */}
      {showCertificate && (
        <div className="bg-green-700 text-white p-4 rounded-lg mt-6 text-center shadow">
          🎉 {t("student_online_class.certificate_message")} <a href="#" className="underline text-yellow-300">{t("student_online_class.download_certificate")}</a>.
        </div>
      )}

      {/* Resources */}
      <div className="bg-gray-800 rounded-lg p-6 shadow-md mt-10 mb-6">
        <h2 className="text-xl font-semibold mb-4">📥 {t("student_online_class.resources_title")}</h2>
        {sectionErrors.resources && (
          <p className="text-sm text-red-300 mb-3">
            {t("student_online_class.resources_error")}
          </p>
        )}
        {resources.length === 0 ? (
          <p className="text-gray-400 text-sm">{t("student_online_class.resources_empty")}</p>
        ) : (
          <ul className="space-y-3 text-gray-200">
            {resources.map((resource) => {
              const sharedAgo = formatRelativeTime(resource.created_at);
              return (
                <li
                  key={resource.id}
                  className="bg-gray-900 px-4 py-3 rounded border border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                >
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      {resource.title}
                      <span className="text-xs uppercase tracking-wide px-2 py-0.5 rounded bg-gray-800 text-gray-400">
                        {t(
                          resource.resource_type === 'file'
                            ? "student_online_class.resource_type_file"
                            : "student_online_class.resource_type_link"
                        )}
                      </span>
                    </p>
                    {sharedAgo && (
                      <p className="text-xs text-gray-500">
                        {t("student_online_class.resource_shared", { time: sharedAgo })}
                      </p>
                    )}
                  </div>
                  <div>
                    {resource.resource_type === 'file' ? (
                      <a
                        href={resource.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-yellow-400 hover:underline"
                      >
                        {t("student_online_class.download_button")}
                      </a>
                    ) : (
                      <a
                        href={resource.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-yellow-400 hover:underline"
                      >
                        {t("student_online_class.open_link_button")}
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

    </div>
  );
}

StudentClassRoom.getLayout = (page) => <StudentLayout>{page}</StudentLayout>;

const ProtectedStudentClassRoom = withAuthProtection(StudentClassRoom, ['student']);
ProtectedStudentClassRoom.getLayout = StudentClassRoom.getLayout;

export default ProtectedStudentClassRoom;
export { StudentClassRoom };

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
