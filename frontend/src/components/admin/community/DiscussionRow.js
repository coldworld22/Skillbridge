import { FaTrash, FaLock, FaEye } from "react-icons/fa";

export default function DiscussionRow({ discussion, onView, onDelete, onLock }) {
  return (
    <div className="flex justify-between items-center p-4 bg-gray-100 rounded shadow hover:bg-gray-50">
      <div>
        <h4 className="text-lg font-semibold">{discussion.title}</h4>
        <p className="text-sm text-gray-600">By {discussion.user}</p>
      </div>
      <div className="flex gap-3 text-gray-700">
        <button onClick={() => onView(discussion)} title="View"><FaEye /></button>
        <button onClick={() => onLock(discussion)} title="Lock"><FaLock /></button>
        <button onClick={() => onDelete(discussion)} title="Delete"><FaTrash /></button>
      </div>
    </div>
  );
}
