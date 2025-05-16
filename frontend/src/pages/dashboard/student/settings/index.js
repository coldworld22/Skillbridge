import StudentLayout from "@/components/layouts/StudentLayout";
import { useState, useEffect } from "react";
import { FaUser, FaCogs, FaShieldAlt, FaCreditCard, FaPalette } from "react-icons/fa";

export default function StudentSettingsPage() {
  const [activeTab, setActiveTab] = useState("account");
  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [bankDetails, setBankDetails] = useState({
    iban: "",
    swift: "",
    bankName: "",
    accountHolder: "",
  });

  useEffect(() => {
    const savedMethod = localStorage.getItem("studentPaymentMethod");
    if (savedMethod) setPaymentMethod(savedMethod);
  }, []);

  const handlePaymentChange = (e) => {
    const value = e.target.value;
    setPaymentMethod(value);
    localStorage.setItem("studentPaymentMethod", value);
  };

  const handleBankChange = (e) => {
    const { name, value } = e.target;
    setBankDetails({ ...bankDetails, [name]: value });
  };

  const tabs = [
    { id: "account", label: "Account Info", icon: <FaUser /> },
    { id: "preferences", label: "Learning Preferences", icon: <FaCogs /> },
    { id: "privacy", label: "Privacy & Security", icon: <FaShieldAlt /> },
    { id: "billing", label: "Billing", icon: <FaCreditCard /> },
    { id: "ui", label: "UI Preferences", icon: <FaPalette /> },
  ];

  return (
    <StudentLayout>
      <div className="p-6 max-w-5xl mx-auto text-gray-800">
        <h1 className="text-3xl font-bold mb-6 text-yellow-500">⚙️ Student Settings</h1>

        {/* Tabs */}
        <div className="flex gap-4 border-b pb-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-2 pb-1 font-medium transition ${
                activeTab === tab.id
                  ? "text-yellow-600 border-b-2 border-yellow-600"
                  : "text-gray-500 hover:text-yellow-600"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Content Panels */}
        {activeTab === "account" && (
          <div className="bg-white rounded-xl shadow p-6 space-y-4">
            <h2 className="text-lg font-semibold">Account Info</h2>
            <input type="text" placeholder="Full Name" className="w-full border px-4 py-2 rounded" />
            <input type="email" placeholder="Email" className="w-full border px-4 py-2 rounded" />
            <hr />
            <h3 className="font-medium">Change Password</h3>
            <input type="password" placeholder="Current Password" className="w-full border px-4 py-2 rounded" />
            <input type="password" placeholder="New Password" className="w-full border px-4 py-2 rounded" />
            <input type="password" placeholder="Confirm New Password" className="w-full border px-4 py-2 rounded" />
            <button className="bg-yellow-500 px-4 py-2 rounded text-black font-medium hover:bg-yellow-600">Save Changes</button>
          </div>
        )}

        {activeTab === "preferences" && (
          <div className="bg-white rounded-xl shadow p-6 space-y-4">
            <h2 className="text-lg font-semibold">Learning Preferences</h2>
            <label className="block font-medium">Preferred Language</label>
            <select className="w-full border px-4 py-2 rounded">
              <option>English</option>
              <option>Arabic</option>
            </select>
            <label className="block font-medium">Subtitle Options</label>
            <select className="w-full border px-4 py-2 rounded">
              <option>On</option>
              <option>Off</option>
            </select>
            <label className="block font-medium">Default Video Speed</label>
            <select className="w-full border px-4 py-2 rounded">
              <option>1x</option>
              <option>1.25x</option>
              <option>1.5x</option>
              <option>2x</option>
            </select>
          </div>
        )}

        {activeTab === "privacy" && (
          <div className="bg-white rounded-xl shadow p-6 space-y-4">
            <h2 className="text-lg font-semibold">Privacy & Security</h2>
            <p>🔒 Two-Factor Authentication: <span className="font-medium">Off</span> <button className="text-blue-600 underline ml-2">Enable</button></p>
            <p>📍 Recent Login: Riyadh, KSA - Chrome</p>
            <button className="text-red-600 underline">Download my data</button>
            <button className="text-red-600 underline">Delete account</button>
          </div>
        )}

        {activeTab === "billing" && (
          <div className="bg-white rounded-xl shadow p-6 space-y-6">
            <h2 className="text-lg font-semibold">Billing</h2>
            <label className="block font-medium">Default Payment Method</label>
            <select
              className="w-full border px-4 py-2 rounded"
              value={paymentMethod}
              onChange={handlePaymentChange}
            >
              <option value="stripe">Stripe</option>
              <option value="paypal">PayPal</option>
              <option value="moyasar">Moyasar</option>
              <option value="bank">Bank Transfer</option>
              <option value="nft">NFT</option>
            </select>

            {paymentMethod === "paypal" && (
              <div className="space-y-2">
                <label className="block font-medium">PayPal Email</label>
                <input
                  type="email"
                  value={paypalEmail}
                  onChange={(e) => setPaypalEmail(e.target.value)}
                  placeholder="Enter your PayPal email"
                  className="w-full border px-4 py-2 rounded"
                />
              </div>
            )}

            {paymentMethod === "bank" && (
              <div className="space-y-2">
                <label className="block font-medium">IBAN</label>
                <input
                  type="text"
                  name="iban"
                  value={bankDetails.iban}
                  onChange={handleBankChange}
                  placeholder="Enter IBAN"
                  className="w-full border px-4 py-2 rounded"
                />
                <label className="block font-medium">SWIFT/BIC</label>
                <input
                  type="text"
                  name="swift"
                  value={bankDetails.swift}
                  onChange={handleBankChange}
                  placeholder="Enter SWIFT Code"
                  className="w-full border px-4 py-2 rounded"
                />
                <label className="block font-medium">Bank Name</label>
                <input
                  type="text"
                  name="bankName"
                  value={bankDetails.bankName}
                  onChange={handleBankChange}
                  placeholder="Enter Bank Name"
                  className="w-full border px-4 py-2 rounded"
                />
                <label className="block font-medium">Account Holder</label>
                <input
                  type="text"
                  name="accountHolder"
                  value={bankDetails.accountHolder}
                  onChange={handleBankChange}
                  placeholder="Enter Account Holder Name"
                  className="w-full border px-4 py-2 rounded"
                />
              </div>
            )}

            <p className="text-sm text-gray-500">You can view or download past invoices from your <a href="/dashboard/student/payments" className="text-blue-600 underline">Payment History</a>.</p>
          </div>
        )}

        {activeTab === "ui" && (
          <div className="bg-white rounded-xl shadow p-6 space-y-4">
            <h2 className="text-lg font-semibold">UI Preferences</h2>
            <label className="block font-medium">App Language</label>
            <select className="w-full border px-4 py-2 rounded">
              <option>English</option>
              <option>Arabic</option>
            </select>
            <label className="block font-medium">Time Zone</label>
            <select className="w-full border px-4 py-2 rounded">
              <option>Asia/Riyadh</option>
              <option>UTC</option>
            </select>
            <label className="block font-medium">Theme</label>
            <select className="w-full border px-4 py-2 rounded">
              <option>Light</option>
              <option>Dark</option>
            </select>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
