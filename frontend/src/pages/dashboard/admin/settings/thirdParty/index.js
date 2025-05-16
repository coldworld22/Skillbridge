// pages/dashboard/admin/settings/thirdParty.js
import AdminLayout from "@/components/layouts/AdminLayout";
import { useState } from "react";
import {
  FaRobot,
  FaWrench,
  FaCalendarAlt,
  FaFeather,
  FaGoogle,
  FaChartBar,
  FaAd,
  FaShieldAlt,
} from "react-icons/fa";
import { SiHuggingface } from "react-icons/si";

// Modal Components
import ChatGPTModal from "@/components/admin/integrations/ChatGPTModal";
import DeepSeekModal from "@/components/admin/integrations/DeepSeekModal";
import ClaudeModal from "@/components/admin/integrations/ClaudeModal";
import GeminiModal from "@/components/admin/integrations/GeminiModal";
import HuggingFaceModal from "@/components/admin/integrations/HuggingFaceModal";
import GoogleCalendarModal from "@/components/admin/integrations/GoogleCalendarModal";
import GoogleAnalyticsModal from "@/components/admin/integrations/GoogleAnalyticsModal";
import GoogleAdSenseModal from "@/components/admin/integrations/GoogleAdSenseModal";
import ReCAPTCHAModal from "@/components/admin/integrations/reCAPTCHAmodal";

export default function ThirdPartyIntegrationsPage() {
  const [showChatGPTModal, setShowChatGPTModal] = useState(false);
  const [showDeepSeekModal, setShowDeepSeekModal] = useState(false);
  const [showClaudeModal, setShowClaudeModal] = useState(false);
  const [showGeminiModal, setShowGeminiModal] = useState(false);
  const [showHuggingFaceModal, setShowHuggingFaceModal] = useState(false);
  const [showGoogleCalendarModal, setShowGoogleCalendarModal] = useState(false);
  const [showGoogleAnalyticsModal, setShowGoogleAnalyticsModal] = useState(false);
  const [showGoogleAdSenseModal, setShowGoogleAdSenseModal] = useState(false);
  const [showReCAPTCHAModal, setShowReCAPTCHAModal] = useState(false);

  const integrations = [
    {
      name: "ChatGPT (OpenAI)",
      description: "Manage your OpenAI API keys and usage preferences.",
      icon: <FaRobot className="text-4xl text-blue-600" />,
      onClick: () => setShowChatGPTModal(true),
    },
    {
      name: "DeepSeek AI",
      description: "Configure DeepSeek large language model settings.",
      icon: <FaWrench className="text-4xl text-green-600" />,
      onClick: () => setShowDeepSeekModal(true),
    },
    {
      name: "Claude (Anthropic)",
      description: "Configure Claude AI model access and behavior.",
      icon: <FaFeather className="text-4xl text-purple-500" />,
      onClick: () => setShowClaudeModal(true),
    },
    {
      name: "Gemini (Google AI)",
      description: "Integrate Gemini AI models from Google Cloud.",
      icon: <FaGoogle className="text-4xl text-indigo-600" />,
      onClick: () => setShowGeminiModal(true),
    },
    {
      name: "Hugging Face",
      description: "Connect with Hugging Face-hosted AI models.",
      icon: <SiHuggingface className="text-4xl text-yellow-500" />,
      onClick: () => setShowHuggingFaceModal(true),
    },
    {
      name: "Google Calendar",
      description: "Sync platform bookings with Google Calendar.",
      icon: <FaCalendarAlt className="text-4xl text-red-500" />,
      onClick: () => setShowGoogleCalendarModal(true),
    },
    {
      name: "Google Analytics",
      description: "Track user activity using Google Analytics.",
      icon: <FaChartBar className="text-4xl text-green-700" />,
      onClick: () => setShowGoogleAnalyticsModal(true),
    },
    {
      name: "Google AdSense",
      description: "Display monetized ads using Google AdSense.",
      icon: <FaAd className="text-4xl text-yellow-600" />,
      onClick: () => setShowGoogleAdSenseModal(true),
    },
    {
      name: "reCAPTCHA v3",
      description: "Protect your forms with Google reCAPTCHA.",
      icon: <FaShieldAlt className="text-4xl text-blue-800" />,
      onClick: () => setShowReCAPTCHAModal(true),
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Third-Party Integrations</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((item, index) => (
            <div
              key={index}
              onClick={item.onClick}
              className="cursor-pointer border border-gray-200 rounded-xl p-5 shadow hover:shadow-lg bg-white transition"
            >
              <div className="flex items-center gap-4">
                {item.icon}
                <div>
                  <h2 className="text-lg font-semibold">{item.name}</h2>
                  <p className="text-gray-600 text-sm">{item.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pop Modals */}
      {showChatGPTModal && <ChatGPTModal onClose={() => setShowChatGPTModal(false)} />}
      {showDeepSeekModal && <DeepSeekModal onClose={() => setShowDeepSeekModal(false)} />}
      {showClaudeModal && <ClaudeModal onClose={() => setShowClaudeModal(false)} />}
      {showGeminiModal && <GeminiModal onClose={() => setShowGeminiModal(false)} />}
      {showHuggingFaceModal && <HuggingFaceModal onClose={() => setShowHuggingFaceModal(false)} />}
      {showGoogleCalendarModal && <GoogleCalendarModal onClose={() => setShowGoogleCalendarModal(false)} />}
      {showGoogleAnalyticsModal && <GoogleAnalyticsModal onClose={() => setShowGoogleAnalyticsModal(false)} />}
      {showGoogleAdSenseModal && <GoogleAdSenseModal onClose={() => setShowGoogleAdSenseModal(false)} />}
      {showReCAPTCHAModal && <ReCAPTCHAModal onClose={() => setShowReCAPTCHAModal(false)} />}
    </AdminLayout>
  );
}
