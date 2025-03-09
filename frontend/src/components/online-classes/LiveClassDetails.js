import Link from "next/link";
import LiveClassCountdown from "@/components/online-classes/LiveClassCountdown";
import LiveStreamPlayer from "@/components/online-classes/LiveStreamPlayer";
import LiveChat from "@/components/online-classes/LiveChat";
import ParticipantsList from "@/components/online-classes/ParticipantsList";
import AttendanceTracker from "@/components/online-classes/AttendanceTracker";
import NotesResources from "@/components/online-classes/NotesResources";
import QASection from "@/components/online-classes/QASection";

// Dummy Data
const dummyLiveClass = {
  id: 1,
  title: "Live React.js Bootcamp",
  instructor: "John Doe",
  date: "March 25, 2025",
  time: "10:00 AM - 12:00 PM",
  price: 20,
  description: "Join us for a hands-on React.js bootcamp!",
  resources: [
    { name: "React Cheat Sheet", url: "/files/react-cheat-sheet.pdf" },
    { name: "Class Slides", url: "/files/react-slides.pdf" },
  ],
};

const LiveClassDetails = ({ liveClass = dummyLiveClass }) => {
  return (
    <div className="container mx-auto px-6 py-8 mt-20">
      {/* 📌 Class Info */}
      <h1 className="text-3xl font-bold text-yellow-400">{liveClass.title}</h1>
      <p className="text-gray-300">{liveClass.description}</p>
      <p className="text-yellow-500">📅 {liveClass.date} | 🕒 {liveClass.time}</p>
      <p className="text-gray-300">👨‍🏫 Instructor: {liveClass.instructor}</p>
      <p className="text-green-400 font-bold text-xl">💰 ${liveClass.price}</p>

      {/* 🔗 Register & Pay Button */}
      <Link href={`/checkout/${liveClass.id}`}>
        <button className="px-6 py-3 bg-yellow-500 text-black rounded-lg font-semibold hover:bg-yellow-400 transition mt-4">
          🔥 Register & Pay
        </button>
      </Link>

      {/* ⏳ Countdown Timer */}
      <LiveClassCountdown date={liveClass.date} time={liveClass.time} />

      {/* 🎥 Live Stream & Chat */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <LiveStreamPlayer liveClassId={liveClass.id} />
        <LiveChat liveClassId={liveClass.id} />
      </div>

      {/* 👥 Participants & Attendance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <AttendanceTracker liveClassId={liveClass.id} />
        <ParticipantsList liveClassId={liveClass.id} />
      </div>

      {/* 📄 Notes & Q&A */}
      <NotesResources resources={liveClass.resources} />
      <QASection liveClassId={liveClass.id} />
    </div>
  );
};

export default LiveClassDetails;
