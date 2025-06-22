// 📁 pages/403.js
import Link from "next/link";

export default function AccessDenied() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-center space-y-6">
      <div>
        <h1 className="text-5xl font-bold text-red-600 mb-4">403</h1>
        <p className="text-lg text-gray-700">Access Denied — You are not authorized to view this page.</p>
      </div>
      <Link href="/" passHref>
        <button className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
          Go Home
        </button>
      </Link>
    </div>
  );
}
