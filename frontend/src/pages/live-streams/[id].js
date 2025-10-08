// pages/dashboard/student/class/[id].js
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { FaVideo, FaCheckCircle } from 'react-icons/fa';
import { motion } from 'framer-motion';

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
  const [showCertificate, setShowCertificate] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (id && mockClasses[id]) {
      setClassData(mockClasses[id]);
    } else if (id) {
      setClassData(null);
    }
  }, [id]);

  const markComplete = (index) => {
    const updated = [...new Set([...completedLessons, index])];
    setCompletedLessons(updated);
    if (updated.length === classData.lessons.length) {
      setShowCertificate(true);
    }
  };

  const sendMessage = () => {
    if (message.trim()) {
      setChatMessages([...chatMessages, { text: message, sender: "You" }]);
      setMessage("");
    }
  };

  if (!id) return <div className="text-white p-10">Loading class...</div>;
  if (!classData) return <div className="text-red-400 p-10">❌ Class not found</div>;

  return (
    <div className="bg-gray-900 min-h-screen text-white px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-yellow-400 mb-2">🎓 {classData.title}</h1>
          <p className="text-sm text-gray-400 mb-4">Instructor: {classData.instructor}</p>

          {/* Progress Bar */}
          <div className="w-full bg-gray-700 rounded-full h-4 mb-4">
            <div
              className="bg-yellow-500 h-4 rounded-full"
              style={{ width: `${(completedLessons.length / classData.lessons.length) * 100}%` }}
            ></div>
          </div>

          {/* Live Video Section */}
          <div className="bg-black rounded-xl overflow-hidden shadow mb-8">
            <video controls className="w-full max-h-[480px]">
              <source src={classData.videoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>

          {/* Lessons List */}
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

          {/* Certificate Message */}
          {showCertificate && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-700 text-white p-4 rounded-lg text-center shadow"
            >
              🎉 Congratulations! You’ve completed all lessons. Your certificate is ready to download.
            </motion.div>
          )}
        </div>

        {/* Live Chat */}
        <div className="w-full lg:w-1/3 bg-gray-800 rounded-lg p-6 shadow-md h-fit max-h-[600px] flex flex-col">
          <h2 className="text-xl font-semibold mb-4">💬 Live Chat</h2>
          <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-2">
            {chatMessages.map((msg, i) => (
              <div key={i} className="bg-gray-700 p-2 rounded">
                <p className="text-sm"><span className="font-semibold text-yellow-400">{msg.sender}:</span> {msg.text}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-grow px-3 py-2 rounded bg-gray-700 text-white"
            />
            <button
              onClick={sendMessage}
              className="bg-yellow-500 px-4 py-2 rounded hover:bg-yellow-600 text-black font-semibold"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}