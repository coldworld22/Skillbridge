import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { FaVideo, FaMicrophone, FaPhoneSlash, FaDoorOpen, FaUsers } from "react-icons/fa";

const breakoutRoomsData = [
  { id: 1, name: "React Fundamentals" },
  { id: 2, name: "Node.js Backend" },
  { id: 3, name: "AI & ML Discussion" },
];

const BreakoutRooms = () => {
  const [currentRoom, setCurrentRoom] = useState(null);
  const videoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);

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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <motion.h1
        className="text-3xl font-bold text-yellow-400 mb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        Breakout Rooms
      </motion.h1>

      <div className="w-full max-w-4xl bg-gray-800 p-6 rounded-lg shadow-lg">
        {/* Room Selection */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-yellow-300 mb-2">Select a Room</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {breakoutRoomsData.map((room) => (
              <motion.button
                key={room.id}
                onClick={() => setCurrentRoom(room.name)}
                className={`p-3 rounded-lg transition ${
                  currentRoom === room.name ? "bg-green-600" : "bg-gray-700"
                } hover:bg-green-700`}
                whileHover={{ scale: 1.05 }}
              >
                {room.name}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Room Details */}
        {currentRoom && (
          <motion.div
            className="mt-6 p-4 bg-gray-700 rounded-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-xl font-semibold text-yellow-400 mb-2">You are in: {currentRoom}</h2>
            <video ref={videoRef} autoPlay playsInline muted={isMuted} className={`w-full rounded-lg ${isVideoOn ? "block" : "hidden"}`} />

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
              <button onClick={() => setCurrentRoom(null)} className="p-3 rounded-full bg-red-600 text-white">
                <FaDoorOpen />
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default BreakoutRooms;
