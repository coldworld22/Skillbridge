import platformNames from "../../../shared/socialPlatforms.json";
import {
  FaLinkedin,
  FaGithub,
  FaTwitter,
  FaYoutube,
  FaFacebook,
  FaInstagram,
  FaGlobe,
} from "react-icons/fa";

const iconMap = {
  linkedin: { Icon: FaLinkedin, className: "text-blue-600" },
  github: { Icon: FaGithub, className: "text-gray-800" },
  twitter: { Icon: FaTwitter, className: "text-blue-400" },
  youtube: { Icon: FaYoutube, className: "text-red-600" },
  facebook: { Icon: FaFacebook, className: "text-blue-700" },
  instagram: { Icon: FaInstagram, className: "text-pink-600" },
  website: { Icon: FaGlobe, className: "text-green-600" },
};

export const allowedPlatforms = platformNames.map((name) => ({
  name,
  ...iconMap[name],
}));

export const socialPlatforms = platformNames;
