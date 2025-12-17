import { useState, useRef } from "react";
import { FaPaperPlane, FaMicrophone, FaVideo, FaTextHeight, FaTimes } from "react-icons/fa";

const AnswerBox = ({ onSubmit }) => {
  const [answerType, setAnswerType] = useState("text");
  const [textAnswer, setTextAnswer] = useState("");
  const [audioBlob, setAudioBlob] = useState(null);
  const [videoBlob, setVideoBlob] = useState(null);
  const audioRecorder = useRef(null);
  const videoRecorder = useRef(null);
  const [isRecording, setIsRecording] = useState(false);

  // 🎤 Start Audio Recording
  const startAudioRecording = async () => {
    setIsRecording(true);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioRecorder.current = new MediaRecorder(stream);
    let chunks = [];
    
    audioRecorder.current.ondataavailable = (event) => {
      chunks.push(event.data);
    };
    
    audioRecorder.current.onstop = () => {
      const audioData = new Blob(chunks, { type: "audio/webm" });
      setAudioBlob(audioData);
    };

    audioRecorder.current.start();
  };

  // 🎤 Stop Audio Recording
  const stopAudioRecording = () => {
    setIsRecording(false);
    audioRecorder.current.stop();
  };

  // 📹 Start Video Recording
  const startVideoRecording = async () => {
    setIsRecording(true);
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    videoRecorder.current = new MediaRecorder(stream);
    let chunks = [];
    
    videoRecorder.current.ondataavailable = (event) => {
      chunks.push(event.data);
    };
    
    videoRecorder.current.onstop = () => {
      const videoData = new Blob(chunks, { type: "video/webm" });
      setVideoBlob(videoData);
    };

    videoRecorder.current.start();
  };

  // 📹 Stop Video Recording
  const stopVideoRecording = () => {
    setIsRecording(false);
    videoRecorder.current.stop();
  };

  // ✅ Submit Answer
  const handleSubmit = () => {
    let answerData = null;

    if (answerType === "text" && textAnswer.trim()) {
      answerData = { type: "text", content: textAnswer };
    } else if (answerType === "audio" && audioBlob) {
      answerData = { type: "audio", content: URL.createObjectURL(audioBlob) };
    } else if (answerType === "video" && videoBlob) {
      answerData = { type: "video", content: URL.createObjectURL(videoBlob) };
    }

    if (answerData) {
      onSubmit(answerData);
      setTextAnswer("");
      setAudioBlob(null);
      setVideoBlob(null);
      setIsRecording(false);
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg mt-4">
      <h3 className="text-lg font-bold text-yellow-500 mb-3">📢 Post Your Answer</h3>

      {/* ✅ Answer Type Selection */}
      <div className="flex gap-4 mb-4">
        <button
          className={`px-4 py-2 rounded-lg transition ${answerType === "text" ? "bg-yellow-500 text-gray-900" : "bg-gray-700 text-white"}`}
          onClick={() => setAnswerType("text")}
        >
          <FaTextHeight /> Text
        </button>
        <button
          className={`px-4 py-2 rounded-lg transition ${answerType === "audio" ? "bg-yellow-500 text-gray-900" : "bg-gray-700 text-white"}`}
          onClick={() => setAnswerType("audio")}
        >
          <FaMicrophone /> Audio
        </button>
        <button
          className={`px-4 py-2 rounded-lg transition ${answerType === "video" ? "bg-yellow-500 text-gray-900" : "bg-gray-700 text-white"}`}
          onClick={() => setAnswerType("video")}
        >
          <FaVideo /> Video
        </button>
      </div>

      {/* ✅ Text Answer Input */}
      {answerType === "text" && (
        <textarea
          className="w-full p-3 bg-gray-700 text-white rounded-lg focus:outline-none h-24"
          placeholder="Write your answer..."
          value={textAnswer}
          onChange={(e) => setTextAnswer(e.target.value)}
        />
      )}

      {/* 🎤 Audio Answer Controls */}
      {answerType === "audio" && (
        <div className="flex gap-4 items-center">
          {isRecording ? (
            <button className="bg-red-500 px-4 py-2 rounded-lg text-white" onClick={stopAudioRecording}>
              ⏹ Stop Recording
            </button>
          ) : (
            <button className="bg-green-500 px-4 py-2 rounded-lg text-white" onClick={startAudioRecording}>
              🎙️ Start Recording
            </button>
          )}
          {audioBlob && <audio controls src={URL.createObjectURL(audioBlob)} />}
        </div>
      )}

      {/* 📹 Video Answer Controls */}
      {answerType === "video" && (
        <div className="flex gap-4 items-center">
          {isRecording ? (
            <button className="bg-red-500 px-4 py-2 rounded-lg text-white" onClick={stopVideoRecording}>
              ⏹ Stop Recording
            </button>
          ) : (
            <button className="bg-green-500 px-4 py-2 rounded-lg text-white" onClick={startVideoRecording}>
              📹 Start Recording
            </button>
          )}
          {videoBlob && (
            <video controls width="250">
              <source src={URL.createObjectURL(videoBlob)} type="video/webm" />
            </video>
          )}
        </div>
      )}

      {/* ✅ Submit Button */}
      <div className="mt-4 flex justify-end">
        <button className="px-6 py-2 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600" onClick={handleSubmit}>
          <FaPaperPlane /> Submit Answer
        </button>
      </div>
    </div>
  );
};

export default AnswerBox;
