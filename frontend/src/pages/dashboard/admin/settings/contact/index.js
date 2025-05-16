// pages/dashboard/admin/settings/contact.js
import { useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { FaSave } from "react-icons/fa";

const initialConfig = {
    "email": "support@skillbridge.com",
    "phone": "+1 555-1234",
    "addressLine": "123 Remote Learning Ave",
    "city": "EdTech City",
    "country": "USA",
    "formRecipient": "support@skillbridge.com",
    "mapEmbedUrl": "https://maps.google.com/embed?pb=..."
};


export default function AdminContactSettings() {
    const [config, setConfig] = useState(initialConfig);

    const handleChange = (field, value) => {
        setConfig((prev) => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        // Replace with actual API call later
        alert("Contact settings saved!");
    };

    return (
        <AdminLayout>
            <div className="max-w-4xl mx-auto px-4 py-8">
                <h1 className="text-3xl font-extrabold text-gray-800 mb-8">📬 Contact Page Settings</h1>

                <div className="bg-white rounded-xl shadow-md p-6 space-y-6 border border-gray-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Public Email</label>
                            <input
                                type="email"
                                className="w-full border rounded-lg p-2 focus:ring focus:ring-yellow-200"
                                value={config.email}
                                onChange={(e) => handleChange("email", e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                            <input
                                type="text"
                                className="w-full border rounded-lg p-2 focus:ring focus:ring-yellow-200"
                                value={config.phone}
                                onChange={(e) => handleChange("phone", e.target.value)}
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Address Line</label>
                            <input
                                type="text"
                                className="w-full border rounded-lg p-2 focus:ring focus:ring-yellow-200"
                                value={config.addressLine}
                                onChange={(e) => handleChange("addressLine", e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">City</label>
                            <input
                                type="text"
                                className="w-full border rounded-lg p-2 focus:ring focus:ring-yellow-200"
                                value={config.city}
                                onChange={(e) => handleChange("city", e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Country</label>
                            <input
                                type="text"
                                className="w-full border rounded-lg p-2 focus:ring focus:ring-yellow-200"
                                value={config.country}
                                onChange={(e) => handleChange("country", e.target.value)}
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Form Recipient Email</label>
                            <input
                                type="email"
                                className="w-full border rounded-lg p-2 focus:ring focus:ring-yellow-200"
                                value={config.formRecipient}
                                onChange={(e) => handleChange("formRecipient", e.target.value)}
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Google Maps Embed URL</label>
                            <input
                                type="text"
                                className="w-full border rounded-lg p-2 focus:ring focus:ring-yellow-200"
                                value={config.mapEmbedUrl}
                                onChange={(e) => handleChange("mapEmbedUrl", e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="text-right">
                        <button
                            onClick={handleSave}
                            className="inline-flex items-center gap-2 bg-yellow-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition"
                        >
                            <FaSave /> Save Settings
                        </button>
                    </div>
                </div>
            </div>
        </AdminLayout>

    );
}
