// pages/dashboard/student/class/[id].js
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { FaVideo, FaCheckCircle } from 'react-icons/fa';
import VideoCallScreen from "@/components/video-call/VideoCallScreen";

const mockClasses = {
  "react-bootcamp": {
    title: "React & Next.js Bootcamp",
    instructor: "Ayman Khalid",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    lessons: [
      { title: "Intro to React", duration: "10 min" },
      { title: "JSX & Components", duration: "15 min" },
      { title: "Props & State", duration: "20 min" },
    ],
  },
  "java-crash-course": {
    title: "Java Crash Course",
    instructor: "Sara Ali",
    videoUrl: "https://www.w3schools.com/html/movie.mp4",
    lessons: [
      { title: "Intro to Java", duration: "12 min" },
      { title: "Loops & Conditions", duration: "18 min" },
    ],
  },
};

export default function StudentClassRoom() {
  const router = useRouter();
  const { id } = router.query;
  const [classData, setClassData] = useState(null);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [assignments, setAssignments] = useState([]);
  const isLive = true;

  useEffect(() => {
    if (id && mockClasses[id]) {
      setClassData(mockClasses[id]);
    } else if (id) {
      setClassData(null);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      console.log("👀 Student joined class:", id);
      setAssignments([
        {
          id: 'assign-1',
          title: 'React Basics Assignment',
          dueDate: '2025-05-28T23:59:00Z',
          status: 'Pending',
        },
        {
          id: 'assign-2',
          title: 'Component Design Challenge',
          dueDate: '2025-05-30T23:59:00Z',
          status: 'Submitted',
        },
      ]);
    }
  }, [id]);

  const markComplete = (index) => {
    setCompletedLessons((prev) => [...new Set([...prev, index])]);
  };

  const sendMessage = () => {
    if (chatInput.trim()) {
      setMessages([...messages, { text: chatInput, sender: "You" }]);
      setChatInput("");
    }
  };

  const showCertificate =
    classData && completedLessons.length === classData.lessons.length;

  if (!id) return <div className="text-white p-10">Loading class...</div>;
  if (!classData) return <div className="text-red-400 p-10">❌ Class not found</div>;

  return (
    <div className="bg-gray-900 min-h-screen text-white px-4 py-8">
      <h1 className="text-2xl font-bold text-yellow-400 mb-4">🎓 {classData.title}</h1>
      <p className="text-sm text-gray-400 mb-4">Instructor: {classData.instructor}</p>

      {/* Progress Bar */}
      <div className="w-full bg-gray-700 rounded-full h-4 mb-6">
        <div
          className="bg-yellow-500 h-4 rounded-full"
          style={{ width: `${(completedLessons.length / classData.lessons.length) * 100}%` }}
        />
      </div>

      {/* Live Class Room */}
      <div className="mb-10 rounded-xl overflow-hidden shadow-lg border-2 border-yellow-500">
        {isLive ? (
          <VideoCallScreen chatId={id} />
        ) : (
          <div className="bg-yellow-800 text-white text-center p-6 rounded-lg shadow">
            ⏳ This class is not live yet. Please come back during the scheduled time.
          </div>
        )}
      </div>

      {/* Lessons Sidebar */}
      <div className="bg-gray-800 rounded-lg p-6 shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">📚 Lessons</h2>
        <ul className="space-y-3">
          {classData.lessons.map((lesson, i) => (
            <li
              key={i}
              className="flex justify-between items-center bg-gray-700 px-4 py-2 rounded hover:bg-gray-600 transition"
            >
              <div>
                <p>{i + 1}. {lesson.title}</p>
                <small className="text-gray-400">Duration: {lesson.duration}</small>
              </div>
              {completedLessons.includes(i) ? (
                <FaCheckCircle className="text-green-400 text-xl" />
              ) : (
                <button
                  onClick={() => markComplete(i)}
                  className="text-sm text-yellow-300 hover:underline"
                >
                  Mark as Complete
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Assignments Section */}
      <div className="bg-gray-800 rounded-lg p-6 shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">📜 Assignments</h2>
        {assignments.length === 0 ? (
          <p className="text-gray-400">No assignments available for this class.</p>
        ) : (
          <ul className="space-y-4">
            {assignments.map((assignment) => (
              <li key={assignment.id} className="flex justify-between items-center bg-gray-700 px-4 py-3 rounded hover:bg-gray-600">
                <div>
                  <p className="font-semibold">{assignment.title}</p>
                  <small className="text-gray-400">Due: {new Date(assignment.dueDate).toLocaleDateString()}</small>
                </div>
                <div>
                  {assignment.status === 'Pending' ? (
                    <button
                      onClick={() => router.push(`/dashboard/student/assignments/${assignment.id}`)}
                      className="text-sm bg-yellow-500 text-black px-4 py-2 rounded hover:bg-yellow-600"
                    >
                      Start
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

      {/* Certificate Message */}
      {showCertificate && (
        <div className="bg-green-700 text-white p-4 rounded-lg mt-6 text-center shadow">
          🎉 You've completed all lessons! 🎓 <a href="#" className="underline text-yellow-300">Download your certificate</a>.
        </div>
      )}

      {/* Resources */}
      <div className="bg-gray-800 rounded-lg p-6 shadow-md mt-10 mb-6">
        <h2 className="text-xl font-semibold mb-4">📥 Resources</h2>
        <ul className="list-disc list-inside text-gray-300">
          <li><a href="#" className="text-yellow-400 hover:underline">React Cheatsheet (PDF)</a></li>
          <li><a href="#" className="text-yellow-400 hover:underline">Component Design Guide</a></li>
        </ul>
      </div>

      {/* Live Chat */}
      <div className="bg-gray-800 rounded-lg p-6 shadow-md mt-10">
        <h2 className="text-xl font-semibold mb-4">💬 Live Chat</h2>
        <div className="h-48 overflow-y-auto space-y-2 mb-4">
          {messages.map((msg, idx) => (
            <div key={idx} className="bg-gray-700 px-3 py-2 rounded text-sm">
              <span className="text-yellow-400 font-semibold">{msg.sender}:</span> {msg.text}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-grow px-3 py-2 rounded bg-gray-700 text-white"
          />
          <button
            onClick={sendMessage}
            className="bg-yellow-500 px-4 py-2 rounded hover:bg-yellow-600 text-black"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
