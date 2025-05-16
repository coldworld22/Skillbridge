// components/admin/WelcomeBanner.js
export default function WelcomeBanner({ name = "Admin" }) {
    const today = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  
    return (
      <div className="bg-white p-6 rounded-xl shadow">
        <h1 className="text-2xl font-bold text-gray-800">Welcome, {name} 👋</h1>
        <p className="text-sm text-gray-500">Today is {today}</p>
      </div>
    );
  }
  