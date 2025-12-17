import {
  Star,
  Eye,
  Calendar,
  MessageCircle,
  BadgeCheck,
  Tag,
  BookOpen,
  DollarSign,
  Languages,
} from "lucide-react";

const TutorialHeader = ({
  title,
  instructor,
  duration,
  category,
  level,
  rating,
  views,
  comments = 0,
  lastUpdated,
  certificate = false,
  price = "Free",
  language = "English", // 🆕 default
}) => (
  <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 md:p-8 rounded-xl shadow-lg border border-gray-700 mb-8">
    <h1 className="text-2xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500 drop-shadow-lg mb-2">
      {title}
    </h1>
    <p className="text-sm md:text-base text-gray-400 mb-4">
      By <span className="font-semibold text-white">{instructor}</span> • {duration}
    </p>

    <div className="flex flex-wrap gap-2 mb-4 text-xs font-medium">
      <span className="flex items-center gap-1 bg-gray-700 text-white px-3 py-1 rounded-full">
        <Tag className="w-4 h-4" /> {category}
      </span>
      <span className="flex items-center gap-1 bg-yellow-500 text-black px-3 py-1 rounded-full">
        <BookOpen className="w-4 h-4" /> {level}
      </span>
      <span
        className={`flex items-center gap-1 px-3 py-1 rounded-full ${
          price === "Free"
            ? "bg-green-600 text-white"
            : "bg-purple-600 text-white"
        }`}
      >
        <DollarSign className="w-4 h-4" /> {price}
      </span>
      <span className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1 rounded-full">
        <Languages className="w-4 h-4" /> {language}
      </span>
      {certificate && (
        <span className="flex items-center gap-1 bg-yellow-400 text-black px-3 py-1 rounded-full">
          <BadgeCheck className="w-4 h-4" /> Certificate Included
        </span>
      )}
    </div>

    <div className="flex flex-wrap items-center gap-5 text-sm text-gray-300">
      <span className="flex items-center gap-1">
        <Star className="w-4 h-4 text-yellow-400" /> {rating}
      </span>
      <span className="flex items-center gap-1">
        <Eye className="w-4 h-4" /> {views} views
      </span>
      <span className="flex items-center gap-1">
        <MessageCircle className="w-4 h-4" /> {comments} comments
      </span>
      {lastUpdated && (
        <span className="flex items-center gap-1">
          <Calendar className="w-4 h-4" /> Updated {lastUpdated}
        </span>
      )}
    </div>
  </div>
);

export default TutorialHeader;
