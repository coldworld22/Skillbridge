import InstructorLayout from "@/components/layouts/InstructorLayout";
import { useState } from "react";
import { FaEdit, FaLock, FaUserShield, FaCogs, FaEye, FaLanguage, FaBookOpen, FaLink } from "react-icons/fa";

export default function InstructorProfilePage() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <InstructorLayout>
      <div className="p-6 text-gray-800 space-y-6 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900">👤 Instructor Profile</h1>

        {/* Tabs */}
        <div className="flex gap-4 border-b pb-2 text-sm sm:text-base">
          {[
            { key: "overview", label: "Overview" },
            { key: "edit", label: "Edit Profile" },
            { key: "professional", label: "Professional Info" },
            { key: "security", label: "Security" },
            { key: "preferences", label: "Preferences" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`font-medium capitalize transition duration-200 px-2 pb-1 ${
                activeTab === key
                  ? "text-yellow-600 border-b-2 border-yellow-600"
                  : "text-gray-500 hover:text-yellow-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content Panels */}
        {activeTab === "overview" && (
          <div className="bg-white p-6 rounded-2xl shadow space-y-6">
            <div className="flex items-center gap-6">
              <img src="https://via.placeholder.com/100" className="rounded-full w-24 h-24 border shadow" alt="Profile" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Ayman Osman</h2>
                <p className="text-sm text-gray-500">Full-Stack Instructor | Saudi Arabia</p>
                <button className="mt-2 text-sm underline text-blue-600 hover:text-blue-800">View Public Profile</button>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <p><strong>📄 Bio:</strong> Passionate about building scalable web apps with React and Node.js. 5+ years of teaching experience.</p>
              <p><strong>🌍 Languages:</strong> English, Arabic</p>
              <p><strong>📧 Email:</strong> ayman@example.com</p>
              <p><strong>📅 Joined:</strong> Feb 2024</p>
              <p><strong>🔗 Social:</strong> <a href="https://linkedin.com/in/ayman" className="text-blue-600 hover:underline">LinkedIn</a>, <a href="https://github.com/ayman" className="text-blue-600 hover:underline">GitHub</a>, <a href="https://twitter.com/ayman" className="text-blue-600 hover:underline">Twitter</a></p>
            </div>
          </div>
        )}

        {activeTab === "edit" && (
          <div className="bg-white p-6 rounded-2xl shadow space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-900"><FaEdit /> Edit Basic Info</h2>
            <input type="text" placeholder="Full Name" defaultValue="Ayman Osman" className="w-full border px-4 py-2 rounded-md" />
            <textarea placeholder="Short Bio" defaultValue="Passionate about building scalable web apps..." className="w-full border px-4 py-2 rounded-md" rows="4" />
            <input type="email" placeholder="Email Address" defaultValue="ayman@example.com" className="w-full border px-4 py-2 rounded-md" />
            <input type="text" placeholder="LinkedIn URL" defaultValue="https://linkedin.com/in/ayman" className="w-full border px-4 py-2 rounded-md" />
            <input type="text" placeholder="GitHub URL" defaultValue="https://github.com/ayman" className="w-full border px-4 py-2 rounded-md" />
            <input type="text" placeholder="Twitter URL" defaultValue="https://twitter.com/ayman" className="w-full border px-4 py-2 rounded-md" />
            <button className="bg-yellow-500 text-black px-5 py-2 rounded-md hover:bg-yellow-600">Save Changes</button>
          </div>
        )}

        {activeTab === "professional" && (
          <div className="bg-white p-6 rounded-2xl shadow space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-900"><FaUserShield /> Professional Information</h2>
            <input type="text" placeholder="Expertise (e.g., JavaScript, Python)" className="w-full border px-4 py-2 rounded-md" />
            <input type="text" placeholder="Years of Experience" className="w-full border px-4 py-2 rounded-md" />
            <input type="text" placeholder="LinkedIn or Portfolio URL" className="w-full border px-4 py-2 rounded-md" />
            <input type="text" placeholder="Certifications (comma separated)" className="w-full border px-4 py-2 rounded-md" />
            <button className="bg-yellow-500 text-black px-5 py-2 rounded-md hover:bg-yellow-600">Update Info</button>
          </div>
        )}

        {activeTab === "security" && (
          <div className="bg-white p-6 rounded-2xl shadow space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-900"><FaLock /> Security Settings</h2>
            <input type="password" placeholder="Current Password" className="w-full border px-4 py-2 rounded-md" />
            <input type="password" placeholder="New Password" className="w-full border px-4 py-2 rounded-md" />
            <input type="password" placeholder="Confirm New Password" className="w-full border px-4 py-2 rounded-md" />
            <button className="bg-red-500 text-white px-5 py-2 rounded-md hover:bg-red-600">Update Password</button>
          </div>
        )}

        {activeTab === "preferences" && (
          <div className="bg-white p-6 rounded-2xl shadow space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-900"><FaCogs /> Teaching Preferences</h2>
            <label className="block font-medium text-sm">Preferred Class Duration</label>
            <select className="w-full border px-4 py-2 rounded-md">
              <option>30 minutes</option>
              <option>60 minutes</option>
              <option>90 minutes</option>
            </select>
            <label className="block font-medium text-sm">Default Class Language</label>
            <select className="w-full border px-4 py-2 rounded-md">
              <option>English</option>
              <option>Arabic</option>
            </select>
            <label className="block font-medium text-sm">Accept New Bookings</label>
            <select className="w-full border px-4 py-2 rounded-md">
              <option>Yes</option>
              <option>No</option>
            </select>
            <button className="bg-yellow-500 text-black px-5 py-2 rounded-md hover:bg-yellow-600">Save Preferences</button>
          </div>
        )}
      </div>
    </InstructorLayout>
  );
}
