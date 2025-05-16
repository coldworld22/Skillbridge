import { FaExclamationCircle, FaTrash } from "react-icons/fa";

export default function ReportedPostCard({ report, onReview, onDelete }) {
  return (
    <div className="border-l-4 border-red-500 bg-white p-4 rounded shadow mb-4">
      <h4 className="font-semibold text-gray-800">{report.reason}</h4>
      <p className="text-sm text-gray-600 mt-1">{report.content}</p>
      <div className="flex gap-3 mt-3">
        <button onClick={() => onReview(report)} className="text-blue-600 hover:underline">Review</button>
        <button onClick={() => onDelete(report)} className="text-red-600 hover:underline"><FaTrash className="inline" /> Delete</button>
      </div>
    </div>
  );
}
