import SOCIAL_PLATFORMS from "@/constants/socialPlatforms";
import {
  FaLinkedin,
  FaGithub,
  FaTwitter,
  FaYoutube,
  FaFacebook,
  FaInstagram,
  FaGlobe,
} from "react-icons/fa";

export const defaultPlatformIcon = {
  Icon: FaGlobe,
  className: "text-gray-500",
};

const iconMap = {
  linkedin: { Icon: FaLinkedin, className: "text-blue-600" },
  github: { Icon: FaGithub, className: "text-gray-800" },
  twitter: { Icon: FaTwitter, className: "text-blue-400" },
  youtube: { Icon: FaYoutube, className: "text-red-600" },
  facebook: { Icon: FaFacebook, className: "text-blue-700" },
  instagram: { Icon: FaInstagram, className: "text-pink-600" },
  website: { Icon: FaGlobe, className: "text-green-600" },
};

export const allowedPlatforms = SOCIAL_PLATFORMS.map((name) => ({
  name,
  ...(iconMap[name] || defaultPlatformIcon),
}));

export const socialPlatforms = SOCIAL_PLATFORMS;
