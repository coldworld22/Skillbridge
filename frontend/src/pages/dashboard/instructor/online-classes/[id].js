import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import VideoCallScreen from "@/components/video-call/VideoCallScreen";
import LessonManager from "@/components/instructors/LessonManager";
import StudentAttendancePanel from "@/components/instructors/StudentAttendancePanel";
import ResourceUploadSection from "@/components/instructors/ResourceUploadSection";
import BreakoutRoomControl from "@/components/instructors/BreakoutRoomControl";
import CertificateIssuancePanel from "@/components/instructors/CertificateIssuancePanel";
import AssignmentManager from "@/components/instructors/AssignmentManager"; // ✅ Assignment Manager added
import StudentProgressPanel from "@/components/instructors/StudentProgressPanel";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import { fetchClassManagementData } from "@/services/instructor/classService";
import useAuthStore from "@/store/auth/authStore";
import withAuthProtection from "@/hooks/withAuthProtection";


const isClassLive = (classData) => {
  return classData?.scheduleStatus === "Ongoing";

};

function InstructorClassRoom() {
  const router = useRouter();
  const { id } = router.query;
  const user = useAuthStore((state) => state.user);

  const [classData, setClassData] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [currentLessonId, setCurrentLessonId] = useState(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const data = await fetchClassManagementData(id);
        if (data) {
          setClassData(data.class);
          setLessons(data.lessons);
          setAssignments(data.assignments);

          // Set the current lesson to the next upcoming lesson by default
          if (data.lessons && data.lessons.length > 0) {
            const now = new Date();
            const upcoming = data.lessons
              .filter((l) => l.start_time && new Date(l.start_time) >= now)
              .sort(
                (a, b) => new Date(a.start_time) - new Date(b.start_time)
              )[0];
            setCurrentLessonId(
              upcoming ? upcoming.id : data.lessons[0]?.id || null
            );
          }
        }
      } catch (err) {
        console.error("Failed to load class data", err);
      }
    };
    load();
  }, [id]);

  if (!id || !classData) return <div className="text-white p-10">Loading class data...</div>;

  return (
    <div className="bg-gray-900 min-h-screen text-white px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-sm text-blue-400 hover:underline mb-2"
        >
          &larr; Back
        </button>
        <h1 className="text-2xl font-bold text-yellow-400">{classData.title}</h1>
        <p className="text-sm text-gray-400">Instructor: {classData.instructor}</p>
        {classData.start_date && (
          <p className="text-xs text-gray-500">Start Time: {new Date(classData.start_date).toLocaleString()}</p>
        )}
        {classData.scheduleStatus && (
          <p className="text-xs font-semibold mt-1 flex items-center gap-2">
            Status: {classData.scheduleStatus}
            {isClassLive(classData) && (
              <span className="ml-2 text-green-400">(Live Now)</span>
            )}
          </p>
        )}
      </div>

      {/* Live Video Panel */}
      <div className="rounded-xl overflow-hidden shadow-lg border-2 border-yellow-500 mb-8">
        <VideoCallScreen chatId={id} userRole="host" />
      </div>

      {/* Instructor Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Manage Lessons */}
        <div className="bg-gray-800 p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-yellow-300 mb-2">📚 Manage Lessons</h2>
          <LessonManager classId={id} initialLessons={lessons} />
        </div>

        {/* Upload Materials */}
        <div className="bg-gray-800 p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-yellow-300 mb-2">📤 Upload Materials</h2>

          <ResourceUploadSection classId={id} isLive={isClassLive(classData)} />

        </div>

        {/* Breakout Room Control */}
        <div className="bg-gray-800 p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-yellow-300 mb-2">🔀 Breakout Rooms</h2>
          <BreakoutRoomControl
            classId={id}
            userName={user?.full_name || user?.name || "Instructor"}
            userRole="host"
          />
        </div>

        {/* Attendance Panel */}
        <div className="bg-gray-800 p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-yellow-300 mb-2">🧑‍🎓 Attendance</h2>
          {lessons.length > 0 && (
            <select
              className="mb-3 w-full bg-gray-700 text-white p-2 rounded"
              value={currentLessonId || ""}
              onChange={(e) => setCurrentLessonId(e.target.value)}
            >
              {lessons.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {lesson.title}
                </option>
              ))}
            </select>
          )}
          <StudentAttendancePanel lessonId={currentLessonId} />
        </div>

        {/* Certificate Issuance */}
        <div className="bg-gray-800 p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-yellow-300 mb-2">🎓 Issue Certificates</h2>
          <CertificateIssuancePanel classId={id} />
        </div>

        {/* Assignment Manager ✅ */}
        <div className="bg-gray-800 p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-yellow-300 mb-2">📋 Manage Assignments</h2>

          <AssignmentManager classId={id} assignments={assignments} />

        </div>

        {/* Student Progress */}
        <div className="bg-gray-800 p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-yellow-300 mb-2">📊 Student Progress</h2>
          <StudentProgressPanel classId={id} />
        </div>
      </div>
    </div>
  );
}

InstructorClassRoom.getLayout = function getLayout(page) {
  return <InstructorLayout>{page}</InstructorLayout>;
};

const ProtectedInstructorClassRoom = withAuthProtection(
  InstructorClassRoom,
  ['instructor']
);
ProtectedInstructorClassRoom.getLayout = InstructorClassRoom.getLayout;
export default ProtectedInstructorClassRoom;
export { InstructorClassRoom };
