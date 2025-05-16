import { FaToggleOn, FaToggleOff, FaTrash } from 'react-icons/fa';

export default function InstructorCard({ instructor, onToggle, onDelete }) {
  return (
    <div className="bg-white rounded shadow p-4 flex flex-col items-center text-center">
      <img
        src={instructor.avatar}
        alt={instructor.name}
        className="w-20 h-20 rounded-full object-cover mb-2"
      />
      <h2 className="font-semibold text-lg">{instructor.name}</h2>
      <p className="text-sm text-gray-500 mb-1">{instructor.email}</p>
      <p className="text-xs text-gray-400">Joined: {instructor.joinDate}</p>

      <div className="mt-3 flex gap-4">
        <button
          onClick={() => onToggle(instructor.id)}
          className="text-blue-600 hover:text-blue-800"
        >
          {instructor.status ? <FaToggleOn size={20} /> : <FaToggleOff size={20} />}
        </button>
        <button
          onClick={() => onDelete(instructor.id)}
          className="text-red-500 hover:text-red-700"
        >
          <FaTrash size={18} />
        </button>
      </div>
    </div>
  );
}
