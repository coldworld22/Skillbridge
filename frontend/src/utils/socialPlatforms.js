import {
  FaLinkedin,
  FaGithub,
  FaTwitter,
  FaYoutube,
  FaFacebook,
  FaInstagram,
  FaGlobe,
} from "react-icons/fa";

export const socialPlatforms = [
  { name: "linkedin", icon: <FaLinkedin className="text-blue-600" /> },
  { name: "github", icon: <FaGithub className="text-gray-800" /> },
  { name: "twitter", icon: <FaTwitter className="text-blue-400" /> },
  { name: "youtube", icon: <FaYoutube className="text-red-600" /> },
  { name: "facebook", icon: <FaFacebook className="text-blue-700" /> },
  { name: "instagram", icon: <FaInstagram className="text-pink-600" /> },
  { name: "website", icon: <FaGlobe className="text-green-600" /> },
];

export const allowedPlatforms = socialPlatforms.map((p) => p.name);
