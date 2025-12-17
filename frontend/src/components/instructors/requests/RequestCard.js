// components/instructor/requests/RequestCard.js
import { FaComments, FaCheck, FaTimes } from "react-icons/fa";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  declined: "bg-red-100 text-red-700",
  default: "bg-gray-100 text-gray-700",
};

const buildInitialPlaceholder = (name) => {
  const firstChar = name?.trim?.()?.charAt(0)?.toUpperCase();
  return `https://via.placeholder.com/40x40?text=${encodeURIComponent(
    firstChar || "S"
  )}`;
};

export default function RequestCard({
  request,
  onAccept,
  onDecline,
  onChat,
  labels = {},
}) {
  const student = request?.student || {};
  const normalizedStatus = request?.status?.toLowerCase?.() || "pending";
  const badgeClasses =
    statusColors[normalizedStatus] || statusColors.default;
  const canRespond = normalizedStatus === "pending";
  const avatarSrc =
    student.avatar || buildInitialPlaceholder(student.name);
  const statusText =
    request?.statusLabel || request?.status || labels?.statusFallback || "";

  const {
    chat: chatLabel = "Chat",
    accept: acceptLabel = "Accept",
    decline: declineLabel = "Decline",
  } = labels || {};

  return (
    <div className="bg-white shadow p-4 rounded-lg flex justify-between items-center gap-4">
      <div className="flex items-center gap-4">
        <img
          src={avatarSrc}
          alt={student.name || "Student"}
          className="w-12 h-12 rounded-full border object-cover"
          loading="lazy"
        />
        <div>
          <h3 className="font-semibold">{student.name}</h3>
          <p className="text-sm text-gray-600">{request.subject}</p>
          <p className="text-sm text-gray-500">{request.date}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className={`px-3 py-1 rounded-full text-sm ${badgeClasses}`}>
          {statusText}
        </span>

        <button
          type="button"
          onClick={onChat}
          className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full"
          title={chatLabel}
          aria-label={chatLabel}
        >
          <FaComments />
        </button>

        {canRespond && (
          <>
            <button
              type="button"
              onClick={onAccept}
              className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-full"
              title={acceptLabel}
              aria-label={acceptLabel}
            >
              <FaCheck />
            </button>
            <button
              type="button"
              onClick={onDecline}
              className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full"
              title={declineLabel}
              aria-label={declineLabel}
            >
              <FaTimes />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
