import { useState } from "react";
import VideoGrid from "./VideoGrid";
import CallControls from "./CallControls";
import ParticipantList from "./ParticipantList";
import ChatDuringCall from "./ChatDuringCall";

const StudentVideoCall = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCallActive, setIsCallActive] = useState(true);

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      {isCallActive ? (
        <>
          {/* Video Grid */}
          <div className="flex flex-1">
            <VideoGrid />
            <ParticipantList />
          </div>

          {/* Call Controls */}
          <CallControls onChatToggle={() => setIsChatOpen(!isChatOpen)} onEndCall={() => setIsCallActive(false)} />
          
          {/* In-Call Chat */}
          {isChatOpen && <ChatDuringCall />}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full">
          <h2 className="text-2xl font-bold">Call Ended</h2>
          <button
            onClick={() => setIsCallActive(true)}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Rejoin Call
          </button>
        </div>
      )}
    </div>
  );
};

export default StudentVideoCall;