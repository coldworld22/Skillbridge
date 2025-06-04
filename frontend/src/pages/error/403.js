// 📁 pages/403.js
export default function AccessDenied() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 text-center">
      <div>
        <h1 className="text-5xl font-bold text-red-600 mb-4">403</h1>
        <p className="text-lg text-gray-700">Access Denied — You are not authorized to view this page.</p>
      </div>
    </div>
  );
}
