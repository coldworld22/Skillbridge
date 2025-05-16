import Link from 'next/link';
import { FaPlus, FaClipboardList } from 'react-icons/fa';

export default function AssignmentManager({ classId }) {
  return (
    <div className="space-y-4">
      <Link
        href={`/dashboard/instructor/assignments/create?classId=${classId}`}
        className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-4 py-3 rounded-full justify-center"
      >
        <FaPlus /> Create New Assignment
      </Link>

      <Link
        href={`/dashboard/instructor/assignments/list?classId=${classId}`}
        className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-bold px-4 py-3 rounded-full justify-center"
      >
        <FaClipboardList /> View My Assignments
      </Link>
    </div>
  );
}
