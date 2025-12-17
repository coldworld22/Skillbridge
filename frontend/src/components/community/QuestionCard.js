import Link from "next/link";
import {
  FaArrowUp,
  FaComment,
  FaEye,
  FaHeart,
  FaCheckCircle,
  FaAward,
} from "react-icons/fa";

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const QuestionCard = ({ question }) => {
  const createdLabel = formatDate(question.createdAt);
  const updatedLabel =
    question.updatedAt && question.updatedAt !== question.createdAt
      ? formatDate(question.updatedAt)
      : null;

  const initials = question.user.name
    ? question.user.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "AN";

  return (
    <Link
      href={`/community/question/${question.id}`}
      className="group block rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-sm transition hover:-translate-y-1 hover:border-yellow-400/50 hover:shadow-xl"
    >
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white transition-colors group-hover:text-yellow-200">
            {question.title}
          </h2>
          <p className="mt-3 text-sm text-slate-300">
            {question.excerpt || "No description provided yet."}
          </p>
        </div>
        <div className="text-right text-xs uppercase tracking-wider text-slate-500">
          <span className="block font-semibold text-slate-200">
            {createdLabel}
          </span>
          {updatedLabel && <span>Updated {updatedLabel}</span>}
        </div>
      </header>

      <div className="mt-5 flex flex-wrap gap-3 text-xs font-medium text-slate-200">
        <span className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-3 py-1">
          <FaArrowUp className="text-yellow-300" />
          {question.votes} votes
        </span>
        <span className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-3 py-1">
          <FaComment className="text-emerald-300" />
          {question.answersCount} answers
        </span>
        <span className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-3 py-1">
          <FaEye className="text-slate-400" />
          {question.views} views
        </span>
        <span className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-3 py-1">
          <FaHeart className="text-rose-300" />
          {question.likes} likes
        </span>
        {question.bounty > 0 && (
          <span className="inline-flex items-center gap-2 rounded-full border border-yellow-400/50 bg-yellow-400/10 px-3 py-1 text-yellow-200">
            <FaAward /> Bounty {question.bounty}
          </span>
        )}
        {question.resolved && (
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/50 bg-emerald-500/10 px-3 py-1 text-emerald-200">
            <FaCheckCircle /> Resolved
          </span>
        )}
      </div>

      {question.tags.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {question.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-slate-800 bg-slate-800/70 px-3 py-1 text-xs font-medium text-slate-200 transition group-hover:border-yellow-400/40 group-hover:text-yellow-200"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <footer className="mt-6 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3">
          {question.user.avatar ? (
            <img
              src={question.user.avatar}
              alt={`${question.user.name} avatar`}
              className="h-9 w-9 rounded-full border border-slate-700 object-cover"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-800 font-semibold text-slate-200">
              {initials}
            </div>
          )}
          <div className="flex flex-col">
            <span className="font-semibold text-slate-200">
              {question.user.name}
            </span>
            <span className="text-[11px] uppercase tracking-widest text-slate-500">
              Asked {createdLabel}
            </span>
          </div>
        </div>
        <span className="text-[11px] uppercase tracking-[0.3em] text-slate-500">
          View details
        </span>
      </footer>
    </Link>
  );
};

export default QuestionCard;
