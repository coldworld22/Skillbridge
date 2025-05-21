import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import { useState } from "react";

const SecuritySettings = () => {
  const [password, setPassword] = useState("");
  const [enable2FA, setEnable2FA] = useState(false);

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <Navbar />
      <div className="container mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-yellow-400">🔒 Security Settings</h1>

        {/* Change Password */}
        <div className="mt-6 bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-yellow-400">Change Password</h2>
          <input
            type="password"
            placeholder="New Password"
            className="w-full p-3 mt-2 bg-gray-700 text-white rounded-lg"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="mt-4 bg-blue-500 px-4 py-2 rounded-lg w-full">Update Password</button>
        </div>

        {/* 2FA Toggle */}
        <div className="mt-6 bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-yellow-400">Two-Factor Authentication (2FA)</h2>
          <label className="flex items-center gap-2 mt-3">
            <input
              type="checkbox"
              checked={enable2FA}
              onChange={() => setEnable2FA(!enable2FA)}
              className="w-5 h-5"
            />
            Enable 2FA Authentication
          </label>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SecuritySettings;
