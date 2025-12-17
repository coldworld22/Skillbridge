// pages/dashboard/instructor/assignments/success.js
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FaCheckCircle, FaArrowRight, FaPlusCircle } from 'react-icons/fa';
import InstructorLayout from '@/components/layouts/InstructorLayout';

export default function AssignmentSuccessPage() {
  const router = useRouter();
  const { title, dueDate } = router.query;

  return (
    <InstructorLayout>
      <div className="min-h-screen flex flex-col justify-center items-center bg-white text-gray-900 px-6 py-10">
        <FaCheckCircle size={80} className="text-green-500 mb-6" />

        <h1 className="text-3xl font-bold text-yellow-500 mb-4">Assignment Created Successfully!</h1>

        <div className="bg-gray-100 p-6 rounded-xl shadow-md text-center w-full max-w-md">
          <h2 className="text-lg font-semibold mb-2">{title || 'Untitled Assignment'}</h2>
          <p className="text-sm text-gray-600 mb-4">
            Due Date: {dueDate ? new Date(dueDate).toLocaleString() : 'Not Set'}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <Link
              href="/dashboard/instructor/assignments"
              className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 rounded-full flex items-center justify-center gap-2"
            >
              <FaArrowRight /> View Assignments
            </Link>

            <Link
              href="/dashboard/instructor/assignments/create"
              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-full flex items-center justify-center gap-2"
            >
              <FaPlusCircle /> Create Another
            </Link>
          </div>
        </div>
      </div>
    </InstructorLayout>
  );
}
