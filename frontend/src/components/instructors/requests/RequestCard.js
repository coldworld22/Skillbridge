// components/instructor/requests/RequestCard.js
import { FaComments, FaCheck, FaTimes } from "react-icons/fa";



const statusColors = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  declined: "bg-red-100 text-red-700",
};

export default function RequestCard({ request, onAccept, onDecline, onChat }) {
  return (
    <div className="bg-white shadow p-4 rounded-lg flex justify-between items-center gap-4">
      <div className="flex items-center gap-4">
        <img
          src={request.student.avatar}
          alt={request.student.name}
          className="w-12 h-12 rounded-full border"
        />
        <div>
          <h3 className="font-semibold">{request.student.name}</h3>
          <p className="text-sm text-gray-600">{request.subject}</p>
          <p className="text-sm text-gray-500">{request.date}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className={`px-3 py-1 rounded-full text-sm ${statusColors[request.status]}`}>
          {request.status}
        </span>

        <button
          onClick={onChat}
          className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full"
          title="Chat"
        >
          <FaComments />
        </button>

        {request.status === "pending" && (
          <>
            <button
              onClick={onAccept}
              className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-full"
              title="Accept"
            >
              <FaCheck />
            </button>
            <button
              onClick={onDecline}
              className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full"
              title="Decline"
            >
              <FaTimes />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
