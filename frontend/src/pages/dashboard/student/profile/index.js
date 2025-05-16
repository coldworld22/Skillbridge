import StudentLayout from "@/components/layouts/StudentLayout";
import { useState } from "react";
import {
  FaEdit,
  FaGraduationCap,
  FaLock,
  FaCogs,
  FaCertificate,
  FaChalkboardTeacher,
} from "react-icons/fa";

export default function StudentProfilePage() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <StudentLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6 text-gray-800">
        <h1 className="text-3xl font-bold text-yellow-500">👤 Student Profile</h1>

        {/* Tabs */}
        <div className="flex gap-4 border-b pb-2 text-sm sm:text-base">
          {["overview", "edit", "academic", "security", "preferences", "certificates", "classes"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`capitalize px-2 pb-1 font-medium transition-all border-b-2 ${
                activeTab === tab
                  ? "text-yellow-600 border-yellow-600"
                  : "text-gray-500 border-transparent hover:text-yellow-600"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === "overview" && (
          <div className="bg-white p-6 rounded-2xl shadow space-y-4">
            <div className="flex items-center gap-6">
              <img src="https://via.placeholder.com/100" className="rounded-full w-24 h-24 border shadow" alt="Profile" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Sara Ali</h2>
                <p className="text-sm text-gray-500">Computer Science Student | Riyadh</p>
                <button className="text-sm underline text-blue-600 hover:text-blue-800 mt-2">View Public Profile</button>
              </div>
            </div>
            <div className="text-sm space-y-2">
              <p><strong>Email:</strong> sara@example.com</p>
              <p><strong>Phone:</strong> +966-555-123456</p>
              <p><strong>Joined:</strong> Jan 2025</p>
            </div>
          </div>
        )}

        {/* Edit */}
        {activeTab === "edit" && (
          <div className="bg-white p-6 rounded-2xl shadow space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-900"><FaEdit /> Edit Profile</h2>
            <input type="text" placeholder="Full Name" className="w-full border px-4 py-2 rounded-md" />
            <input type="email" placeholder="Email Address" className="w-full border px-4 py-2 rounded-md" />
            <input type="tel" placeholder="Phone Number" className="w-full border px-4 py-2 rounded-md" />
            <button className="bg-yellow-500 text-black px-5 py-2 rounded-md hover:bg-yellow-600">Save Changes</button>
          </div>
        )}

        {/* Academic */}
        {activeTab === "academic" && (
          <div className="bg-white p-6 rounded-2xl shadow space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-900"><FaGraduationCap /> Academic Info</h2>
            <input type="text" placeholder="Field of Study" className="w-full border px-4 py-2 rounded-md" />
            <select className="w-full border px-4 py-2 rounded-md">
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            <button className="bg-yellow-500 text-black px-5 py-2 rounded-md hover:bg-yellow-600">Update Info</button>
          </div>
        )}

        {/* Security */}
        {activeTab === "security" && (
          <div className="bg-white p-6 rounded-2xl shadow space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-900"><FaLock /> Change Password</h2>
            <input type="password" placeholder="Current Password" className="w-full border px-4 py-2 rounded-md" />
            <input type="password" placeholder="New Password" className="w-full border px-4 py-2 rounded-md" />
            <input type="password" placeholder="Confirm New Password" className="w-full border px-4 py-2 rounded-md" />
            <button className="bg-red-500 text-white px-5 py-2 rounded-md hover:bg-red-600">Update Password</button>
          </div>
        )}

        {/* Preferences */}
        {activeTab === "preferences" && (
          <div className="bg-white p-6 rounded-2xl shadow space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-900"><FaCogs /> Preferences</h2>
            <label className="block text-sm font-medium">Preferred Language</label>
            <select className="w-full border px-4 py-2 rounded-md">
              <option>English</option>
              <option>Arabic</option>
            </select>
            <label className="block text-sm font-medium">Email Notifications</label>
            <select className="w-full border px-4 py-2 rounded-md">
              <option>Enabled</option>
              <option>Disabled</option>
            </select>
            <button className="bg-yellow-500 text-black px-5 py-2 rounded-md hover:bg-yellow-600">Save Preferences</button>
          </div>
        )}

        {/* Certificates */}
        {activeTab === "certificates" && (
          <div className="bg-white p-6 rounded-2xl shadow space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-900"><FaCertificate /> Certificates</h2>
            <p className="text-sm text-gray-600">You have earned 2 certificates:</p>
            <ul className="list-disc ml-6 text-sm">
              <li>React & Next.js Bootcamp</li>
              <li>Python for Beginners</li>
            </ul>
            <button className="text-sm text-blue-600 underline">View All Certificates</button>
          </div>
        )}

        {/* Classes */}
        {activeTab === "classes" && (
          <div className="bg-white p-6 rounded-2xl shadow space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-900"><FaChalkboardTeacher /> My Classes</h2>
            <p className="text-sm text-gray-600">You are enrolled in 3 classes:</p>
            <ul className="list-disc ml-6 text-sm">
              <li>React & Next.js Bootcamp – 60% completed</li>
              <li>Python for Beginners – 100% completed</li>
              <li>Node.js Fundamentals – Starts May 5</li>
            </ul>
            <button className="text-sm text-blue-600 underline">Go to Classes</button>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
