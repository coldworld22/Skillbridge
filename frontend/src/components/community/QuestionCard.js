import { useRouter } from "next/router";
import { FaArrowUp, FaArrowDown, FaEye, FaComment, FaHeart, FaUser } from "react-icons/fa";

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
        <FaArrowUp />
        <span className="text-yellow-400 font-bold">{question.votes ?? 0}</span>
        <FaArrowDown />
        <span className="flex items-center gap-1 text-red-400 ml-4"><FaHeart /> {question.likes ?? 0}</span>
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
        <span className="flex items-center gap-1">
          {question.user_avatar ? (
            <img src={question.user_avatar} alt="avatar" className="w-5 h-5 rounded-full" />
          ) : (
            <FaUser />
          )}
          <span className="text-yellow-500">{question.user?.name || question.user_name || 'Anonymous'}</span>
        </span>
      </div>
    </div>
  );
};

export default QuestionCard;
