import {
  FaLinkedin,
  FaGithub,
  FaTwitter,
  FaYoutube,
  FaFacebook,
  FaInstagram,
  FaGlobe,
} from "react-icons/fa";

const socialPlatforms = [
  { name: "linkedin", icon: <FaLinkedin className="text-blue-600" /> },
  { name: "github", icon: <FaGithub className="text-gray-800" /> },
  { name: "twitter", icon: <FaTwitter className="text-blue-400" /> },
  { name: "youtube", icon: <FaYoutube className="text-red-600" /> },
  { name: "facebook", icon: <FaFacebook className="text-blue-700" /> },
  { name: "instagram", icon: <FaInstagram className="text-pink-600" /> },
  { name: "website", icon: <FaGlobe className="text-green-600" /> },
];

export default function SocialLinksSection({ socialLinks, onChange, t }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">{t('social_links')}</label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {socialPlatforms.map((platform) => (
          <div key={platform.name} className="bg-gray-50 p-3 rounded-lg">
            <label className="text-sm flex items-center gap-2 font-medium mb-1">
              {platform.icon} {platform.name.charAt(0).toUpperCase() + platform.name.slice(1)}
            </label>
            <input
              type="text"
              name={platform.name}
              value={socialLinks[platform.name] || ""}
              onChange={(e) => onChange({ ...socialLinks, [platform.name]: e.target.value })}
              placeholder={`https://${platform.name}.com/yourprofile`}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
