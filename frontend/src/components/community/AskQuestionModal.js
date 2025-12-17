import { useState } from "react";
import { FaTimes, FaPlus, FaRobot } from "react-icons/fa";
import { toast } from "react-toastify";
import UserFilter from "./UserFilter";
import { Button } from "@/components/ui/button";
import modalStyles from "@/components/common/Modal.module.scss";

const AskQuestionModal = ({ onClose, onSubmit }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [invitedUsers, setInvitedUsers] = useState([]);
  const [answerType, setAnswerType] = useState("community");

  // Handle Question Submission
  const handleSubmit = () => {
    if (!title || !description) return toast.error("Please enter question details!");

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
    <div className={modalStyles.simpleOverlay}>
      <div className={modalStyles.panel} style={{ maxWidth: "40rem" }}>
        <div className={modalStyles.headerRow}>
          <h2 className={modalStyles.title}>📝 Ask a Question</h2>
          <button
            className={modalStyles.closeButton}
            aria-label="Close"
            onClick={onClose}
          >
            <FaTimes />
          </button>
        </div>

        <div className={modalStyles.field}>
          <input
            type="text"
            placeholder="Question Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={modalStyles.input}
          />
        </div>
        <textarea
          placeholder="Describe your question..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={modalStyles.textarea}
          style={{ minHeight: "7rem", marginTop: "0.5rem" }}
        />
        <div className={modalStyles.field}>
          <input
            type="text"
            placeholder="Tags (comma separated)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className={modalStyles.input}
          />
        </div>

        <div className={modalStyles.section}>
          <h3 className={modalStyles.subtitle}>Who can answer?</h3>
          <div className={modalStyles.optionButtons}>
            <button
              className={`${modalStyles.optionButton} ${
                answerType === "community" ? modalStyles.optionButtonActive : ""
              }`}
              onClick={() => setAnswerType("community")}
            >
              🌍 General Community
            </button>
            <button
              className={`${modalStyles.optionButton} ${
                answerType === "specific" ? modalStyles.optionButtonActive : ""
              }`}
              onClick={() => setAnswerType("specific")}
            >
              🎯 Specific Users
            </button>
            <button
              className={`${modalStyles.optionButton} ${
                answerType === "ai" ? modalStyles.optionButtonActive : ""
              }`}
              onClick={() => setAnswerType("ai")}
            >
              🤖 AI Assistance
            </button>
          </div>
        </div>

        {answerType === "specific" && (
          <div className={modalStyles.section}>
            <UserFilter
              onInvite={(user) => setInvitedUsers([...invitedUsers, user])}
            />
          </div>
        )}

        <div className={modalStyles.ctaRow}>
          <Button variant="accent" onClick={handleSubmit}>
            <FaPlus /> Submit Question
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AskQuestionModal;
