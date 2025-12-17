// pages/dashboard/student/class/[id].js
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { FaCheckCircle } from 'react-icons/fa';
import { motion } from 'framer-motion';
import styles from './live-streams.module.scss';

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

  if (!id) return <div className={styles.state}>Loading class...</div>;
  if (!classData) return <div className={`${styles.state} ${styles.stateError}`}>❌ Class not found</div>;

  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        <div className={styles.content}>
          <h1 className={styles.title}>🎓 {classData.title}</h1>
          <p className={styles.instructor}>Instructor: {classData.instructor}</p>

          {/* Progress Bar */}
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${(completedLessons.length / classData.lessons.length) * 100}%` }}
            ></div>
          </div>

          {/* Live Video Section */}
          <div className={styles.videoWrapper}>
            <video controls className={styles.video}>
              <source src={classData.videoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>

          {/* Lessons List */}
          <div className={styles.sectionCard}>
            <h2 className={styles.sectionTitle}>📚 Lessons</h2>
            <ul className={styles.lessons}>
              {classData.lessons.map((lesson, i) => (
                <li
                  key={i}
                  className={styles.lesson}
                >
                  <div className={styles.lessonMeta}>
                    <p>{i + 1}. {lesson.title}</p>
                    <small className={styles.lessonDuration}>Duration: {lesson.duration}</small>
                  </div>
                  {completedLessons.includes(i) ? (
                    <FaCheckCircle color="#22c55e" size={20} />
                  ) : (
                    <button
                      onClick={() => markComplete(i)}
                      className={styles.completeBtn}
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
              className={styles.certificate}
            >
              🎉 Congratulations! You’ve completed all lessons. Your certificate is ready to download.
            </motion.div>
          )}
        </div>

        {/* Live Chat */}
        <div className={styles.chatPanel}>
          <h2 className={styles.chatTitle}>💬 Live Chat</h2>
          <div className={styles.messages}>
            {chatMessages.map((msg, i) => (
              <div key={i} className={styles.message}>
                <p className={styles.messageText}><span className={styles.messageSender}>{msg.sender}:</span> {msg.text}</p>
              </div>
            ))}
          </div>
          <div className={styles.inputRow}>
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className={styles.chatInput}
            />
            <button
              onClick={sendMessage}
              className={styles.sendBtn}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
