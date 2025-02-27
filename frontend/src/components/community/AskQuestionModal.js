import { useState } from "react";
import { FaTimes, FaPlus, FaRobot } from "react-icons/fa";
import UserFilter from "./UserFilter";

const AskQuestionModal = ({ onClose, onSubmit }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [invitedUsers, setInvitedUsers] = useState([]);
  const [answerType, setAnswerType] = useState("community");

  // Handle Question Submission
  const handleSubmit = () => {
    if (!title || !description) return alert("Please enter question details!");

    onSubmit({
      title,
      description,
      tags: tags.split(",").map((t) => t.trim()),
      invitedUsers,
      answerType,
    });

    setTitle("");
    setDescription("");
    setTags("");
    setInvitedUsers([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-gray-900 p-6 rounded-lg max-w-2xl w-full">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-yellow-500">📝 Ask a Question</h2>
          <FaTimes className="cursor-pointer text-white" onClick={onClose} />
        </div>

        {/* ✅ Question Fields */}
        <input
          type="text"
          placeholder="Question Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-3 bg-gray-700 text-white rounded-lg mt-4"
        />
        <textarea
          placeholder="Describe your question..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-3 bg-gray-700 text-white rounded-lg mt-4 h-24"
        />
        <input
          type="text"
          placeholder="Tags (comma separated)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="w-full p-3 bg-gray-700 text-white rounded-lg mt-4"
        />

        {/* ✅ Answer Preference */}
        <div className="mt-4">
          <h3 className="text-yellow-400">Who can answer?</h3>
          <div className="flex gap-4 mt-2">
            <button
              className={`px-4 py-2 rounded-lg transition ${answerType === "community" ? "bg-yellow-500 text-gray-900" : "bg-gray-700 text-white"}`}
              onClick={() => setAnswerType("community")}
            >
              🌍 General Community
            </button>
            <button
              className={`px-4 py-2 rounded-lg transition ${answerType === "specific" ? "bg-yellow-500 text-gray-900" : "bg-gray-700 text-white"}`}
              onClick={() => setAnswerType("specific")}
            >
              🎯 Specific Users
            </button>
            <button
              className={`px-4 py-2 rounded-lg transition ${answerType === "ai" ? "bg-yellow-500 text-gray-900" : "bg-gray-700 text-white"}`}
              onClick={() => setAnswerType("ai")}
            >
              🤖 AI Assistance
            </button>
          </div>
        </div>

        {/* ✅ User Filter (Only Show If "Specific Users" Selected) */}
        {answerType === "specific" && <UserFilter onInvite={(user) => setInvitedUsers([...invitedUsers, user])} />}

        {/* ✅ Submit Button */}
        <div className="mt-6 flex justify-end">
          <button className="px-6 py-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600" onClick={handleSubmit}>
            <FaPlus /> Submit Question
          </button>
        </div>
      </div>
    </div>
  );
};

export default AskQuestionModal;
