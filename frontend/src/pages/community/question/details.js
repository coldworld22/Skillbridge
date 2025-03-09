import { useState, useEffect } from "react";
import { FaArrowUp, FaArrowDown, FaEye, FaComment, FaUser, FaHeart, FaVideo, FaPaperclip, FaMicrophone, FaTrash, FaEdit } from "react-icons/fa";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import { useRouter } from "next/router";
import RichTextEditor from "@/components/RichTextEditor";
import ReactMarkdown from "react-markdown";

const sampleQuestion = {
  id: 1,
  title: "How to use useEffect in React?",
  description: "I'm struggling to understand the use cases for useEffect. When should I use it?",
  tags: ["React", "Hooks", "JavaScript"],
  votes: 12,
  likes: 5,
  answers: [
    {
      id: 1,
      text: "You should use useEffect for side effects like API calls, event listeners, or updating the DOM.",
      user: { name: "Alice", reputation: 400 },
      date: "1 day ago",
      votes: 5,
      replies: [
        { id: 11, text: "I use it for API calls!", user: { name: "Bob", reputation: 350 }, date: "10 hours ago" },
        { id: 12, text: "Don't forget cleanup functions!", user: { name: "Charlie", reputation: 420 }, date: "5 hours ago" }
      ],
    },
  ],
  views: 150,
  user: { name: "John Doe", reputation: 320 },
  date: "2 days ago",
};

const QuestionDetails = () => {
  const [likes, setLikes] = useState(sampleQuestion.likes);
  const [votes, setVotes] = useState(sampleQuestion.votes);
  const [replyText, setReplyText] = useState("");
  const [replies, setReplies] = useState([]);
  const [audioFile, setAudioFile] = useState(null);
  const [file, setFile] = useState(null);
  const router = useRouter();

  // ✅ Handle Like Button
  const handleLike = () => setLikes(likes + 1);

  // ✅ Handle Vote System
  const handleVote = (type) => {
    if (type === "up") setVotes(votes + 1);
    if (type === "down") setVotes(votes - 1);
  };

  // ✅ Handle Audio Upload
  const handleAudioUpload = (e) => setAudioFile(e.target.files[0]);

  // ✅ Handle File Upload
  const handleFileUpload = (e) => setFile(e.target.files[0]);

  // ✅ Handle Video Call Invitation
  const handleVideoInvite = () => {
    const chatId = Math.random().toString(36).substr(2, 9);
    router.push(`/video-call/${chatId}`);
  };

  // ✅ Handle Reply Submission
  const handleReply = () => {
    if (replyText) {
      setReplies([...replies, { text: replyText, user: { name: "You" }, date: "Just now" }]);
      setReplyText("");
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <Navbar />
      <div className="container mx-auto px-6 py-8 mt-16">
        <h1 className="text-3xl font-bold text-yellow-500">{sampleQuestion.title}</h1>
        <div className="flex items-center text-gray-400 text-sm mt-2">
          <FaUser className="mr-2 text-yellow-500" />
          <span className="font-bold text-white">{sampleQuestion.user.name}</span>
          <span className="ml-4">{sampleQuestion.date}</span>
        </div>

        {/* ✅ Voting, Likes, Views */}
        <div className="flex items-center gap-6 mt-4 text-gray-400">
          <button className="flex items-center gap-1 text-gray-400 hover:text-red-500" onClick={handleLike}>
            <FaHeart /> {likes} Likes
          </button>
          <button className="flex items-center gap-1" onClick={() => handleVote("up")}>
            <FaArrowUp /> {votes} Votes
          </button>
          <button className="flex items-center gap-1" onClick={() => handleVote("down")}>
            <FaArrowDown /> Downvote
          </button>
          <span className="flex items-center gap-1">
            <FaEye /> {sampleQuestion.views} views
          </span>
        </div>

        {/* ✅ Question Content */}
        <p className="text-gray-300 mt-4">{sampleQuestion.description}</p>

        {/* ✅ Tags */}
        <div className="flex space-x-2 mt-3">
          {sampleQuestion.tags.map((tag, index) => (
            <span key={index} className="bg-yellow-600 px-2 py-1 rounded text-sm text-white">
              {tag}
            </span>
          ))}
        </div>

        {/* ✅ Answers Section */}
        <h2 className="text-2xl font-bold text-yellow-500 mt-8">Answers</h2>
        <div className="mt-4 space-y-6">
          {sampleQuestion.answers.map((answer) => (
            <div key={answer.id} className="bg-gray-800 p-4 rounded-lg shadow-md">
              <p className="text-gray-300 mt-2"><ReactMarkdown>{answer.text}</ReactMarkdown></p>

              {/* ✅ Reply to Answer */}
              <textarea
                className="w-full mt-3 p-2 bg-gray-700 text-white rounded-lg"
                rows="2"
                placeholder="Reply to this answer..."
              ></textarea>
              <button className="mt-2 px-4 py-2 bg-yellow-500 text-gray-900 font-bold rounded-lg hover:bg-yellow-600">
                Post Reply
              </button>
            </div>
          ))}
        </div>

        {/* ✅ User Reply Section */}
        <h2 className="text-2xl font-bold text-yellow-500 mt-8">Your Reply</h2>
        <RichTextEditor onChange={setReplyText} />
        <button onClick={handleReply} className="mt-4 px-6 py-3 bg-yellow-500 text-gray-900 font-bold rounded-lg hover:bg-yellow-600">
          Post Reply
        </button>

        {/* ✅ File & Video Call */}
        <input type="file" accept="audio/*" className="mt-3 bg-gray-800 p-2 rounded-lg text-white" onChange={handleAudioUpload} />
        <input type="file" accept=".pdf,.jpg,.png" className="mt-3 bg-gray-800 p-2 rounded-lg text-white" onChange={handleFileUpload} />
        <button onClick={handleVideoInvite} className="mt-3 px-6 py-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 flex items-center gap-2">
          <FaVideo /> Start Video Call
        </button>
      </div>

      <Footer />
    </div>
  );
};

export default QuestionDetails;
