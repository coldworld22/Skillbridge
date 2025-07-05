import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import {
  fetchTutorialComments,
  postTutorialComment,
} from "@/services/tutorialService";
const CommentsSection = ({ tutorialId, canComment }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const containerRef = useRef(null);

  useEffect(() => {
    if (!tutorialId) return;
    const load = async () => {
      try {
        const list = await fetchTutorialComments(tutorialId);
        setComments(list);
      } catch (err) {
        console.error("Failed to load comments", err);
      }
    };
    load();
  }, [tutorialId]);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    try {
      await postTutorialComment(tutorialId, { message: newComment });
      const list = await fetchTutorialComments(tutorialId);
      setComments(list);
      setNewComment("");
      setTimeout(() => {
        containerRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      console.error("Failed to post comment", err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow mb-12">
      <h3 className="text-lg font-semibold text-yellow-400 mb-4">💬 Comments</h3>

      {canComment && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-6">
          <input
            type="text"
            placeholder="Write a comment and press Enter..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={240}
            className="flex-grow px-4 py-2 rounded bg-gray-700 text-white placeholder-gray-400 outline-none"
          />
          <button
            onClick={handleSubmit}
            className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-full flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>
      )}

      {!canComment && (
        <p className="text-gray-400 italic mb-6">Only enrolled students can comment.</p>
      )}

      {comments.length === 0 ? (
        <p className="text-gray-400 italic text-sm">No comments yet. Be the first to share your thoughts!</p>
      ) : (
        <div className="space-y-4" ref={containerRef}>
          {comments.map((comment) => (
            <motion.div
              key={comment.id}
              className="bg-gray-700 p-4 rounded shadow-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-start gap-2 mb-1">
                <img
                  src={comment.avatar_url}
                  alt={comment.full_name}
                  className="w-8 h-8 rounded-full object-cover border"
                />
                <p className="text-yellow-300 font-semibold">{comment.full_name}</p>
              </div>
              <p className="text-gray-200 text-sm ml-10">{comment.message}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentsSection;
