import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FaVideo, FaMicrophone, FaPhoneSlash, FaShareSquare, FaCommentDots } from "react-icons/fa";

const StudyGroupVideoCall = () => {
  const videoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    startVideoStream();
  }, []);

  const startVideoStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error accessing webcam:", error);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    setIsVideoOn(!isVideoOn);
  };

  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      setIsSharing(true);
      videoRef.current.srcObject = stream;
    } catch (error) {
      console.error("Error sharing screen:", error);
    }
  };

  const stopScreenShare = () => {
    setIsSharing(false);
    startVideoStream(); // Switch back to webcam
  };

  const sendMessage = () => {
    if (message.trim()) {
      setMessages([...messages, { user: "You", text: message }]);
      setMessage("");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <motion.h1
        className="text-3xl font-bold text-yellow-400 mb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        Live Study Group Session
      </motion.h1>

      <div className="relative w-full max-w-4xl bg-gray-800 p-6 rounded-lg shadow-lg">
        <video ref={videoRef} autoPlay playsInline muted={isMuted} className={`w-full rounded-lg ${isVideoOn ? "block" : "hidden"}`} />

        {/* Chat Panel */}
        <div className="mt-4 p-4 bg-gray-700 rounded-lg">
          <h2 className="text-lg font-semibold text-yellow-300 mb-2">Group Chat</h2>
          <div className="h-40 overflow-y-auto bg-gray-800 p-3 rounded-lg mb-2">
            {messages.length > 0 ? (
              messages.map((msg, index) => (
                <motion.div
                  key={index}
                  className="p-2 bg-gray-600 rounded-lg mb-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <p className="text-yellow-300 font-semibold">{msg.user}</p>
                  <p className="text-gray-200">{msg.text}</p>
                </motion.div>
              ))
            ) : (
              <p className="text-gray-400">No messages yet. Start chatting!</p>
            )}
          </div>
          <div className="flex">
            <input
              type="text"
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none"
            />
            <button
              onClick={sendMessage}
              className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center"
            >
              <FaCommentDots className="mr-2" /> Send
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-4 flex justify-center space-x-4">
          <button
            onClick={toggleMute}
            className={`p-3 rounded-full ${isMuted ? "bg-red-600" : "bg-green-600"} text-white`}
          >
            <FaMicrophone />
          </button>
          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full ${isVideoOn ? "bg-blue-600" : "bg-gray-600"} text-white`}
          >
            <FaVideo />
          </button>
          <button
            onClick={isSharing ? stopScreenShare : startScreenShare}
            className="p-3 rounded-full bg-yellow-500 text-white"
          >
            <FaShareSquare />
          </button>
          <button className="p-3 rounded-full bg-red-600 text-white">
            <FaPhoneSlash />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudyGroupVideoCall;
