import { useRouter } from "next/router";
import { FaArrowUp, FaArrowDown, FaEye, FaComment } from "react-icons/fa";

const QuestionCard = ({ question }) => {
  const router = useRouter();

  const tags = Array.isArray(question.tags)
    ? question.tags
    : [];
  const answersCount = Array.isArray(question.answers)
    ? question.answers.length
    : 0;

  const description = question.description || question.content || "";

  return (
    <div
      className="bg-gray-800 p-4 rounded-lg shadow-md hover:shadow-lg transition cursor-pointer"
      onClick={() => router.push(`/community/question/${question.id}`)}
    >
      {/* Votes */}
      <div className="flex items-center space-x-2">
        <button className="text-gray-400 hover:text-yellow-500">
          <FaArrowUp />
        </button>
        <span className="text-yellow-400 font-bold">{question.votes ?? 0}</span>
        <button className="text-gray-400 hover:text-yellow-500">
          <FaArrowDown />
        </button>
      </div>

      {/* Question Content */}
      <h2 className="text-lg font-bold text-white">{question.title}</h2>
      <p className="text-gray-400">{description}</p>

      {/* Tags */}
      <div className="flex space-x-2 mt-2">
        {tags.length > 0 ? (
          tags.map((tag, index) => (
            <span key={index} className="bg-yellow-600 px-2 py-1 rounded text-sm text-white">
              {tag}
            </span>
          ))
        ) : (
          <span className="text-gray-500">No tags</span>
        )}
      </div>

      {/* Footer: Views, Answers Count, User Info */}
      <div className="flex justify-between mt-3 text-gray-400 text-sm">
        <span className="flex items-center gap-1"><FaEye /> {question.views ?? 0} views</span>
        <span className="flex items-center gap-1"><FaComment /> {answersCount} answers</span>
        <span className="text-yellow-500">{question.user?.name || question.user_name || 'Anonymous'}</span>
      </div>
    </div>
  );
};

export default QuestionCard;
