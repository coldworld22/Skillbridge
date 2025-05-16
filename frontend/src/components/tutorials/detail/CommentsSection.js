import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Send, Trash } from "lucide-react";

const CommentsSection = () => {
  const [comments, setComments] = useState([
    { id: 1, user: "Ayman Dev", text: "Amazing tutorial! Very clear and helpful." },
    { id: 2, user: "Sarah UX", text: "Loved the React hooks explanation 👏" },
  ]);
  const [newComment, setNewComment] = useState("");
  const containerRef = useRef(null);

  const handleSubmit = () => {
    if (!newComment.trim()) return;

    const newEntry = {
      id: Date.now(),
      user: "You",
      text: newComment,
      timestamp: new Date(),
    };

    setComments([newEntry, ...comments]);
    setNewComment("");

    // Scroll to top of comments (new one)
    setTimeout(() => {
      containerRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleDelete = (id) => {
    setComments((prev) => prev.filter((c) => c.id !== id));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow mb-12">
      <h3 className="text-lg font-semibold text-yellow-400 mb-4">💬 Comments</h3>

      {/* Input Section */}
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

      {/* Comment List */}
      {comments.length === 0 ? (
        <p className="text-gray-400 italic text-sm">No comments yet. Be the first to share your thoughts!</p>
      ) : (
        <div className="space-y-4" ref={containerRef}>
          {comments.map((comment) => (
            <motion.div
              key={comment.id}
              className="bg-gray-700 p-4 rounded shadow-sm relative"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex justify-between items-start mb-1">
                <p className="text-yellow-300 font-semibold">{comment.user}</p>
                {comment.user === "You" && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="text-gray-400 hover:text-red-400 transition"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-gray-200 text-sm">{comment.text}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentsSection;
