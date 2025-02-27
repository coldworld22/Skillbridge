import Link from "next/link";

export default function DashboardHome() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
      <h1 className="text-4xl font-bold">Welcome to Your Dashboard 🎯</h1>
      <p className="mt-4 text-gray-400">Manage your courses, profile, and settings from here.</p>
      
      <div className="mt-6 space-x-4">
        <Link href="/dashboard/profile">
          <span className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition cursor-pointer">
            Profile
          </span>
        </Link>
        <Link href="/dashboard/settings">
          <span className="px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition cursor-pointer">
            Settings
          </span>
        </Link>
      </div>
    </div>
  );
}
