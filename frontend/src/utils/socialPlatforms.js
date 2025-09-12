import {
  FaLinkedin,
  FaGithub,
  FaTwitter,
  FaYoutube,
  FaFacebook,
  FaInstagram,
  FaGlobe,
} from 'react-icons/fa';

export const allowedPlatforms = [
  { name: 'linkedin', Icon: FaLinkedin, className: 'text-blue-600' },
  { name: 'github', Icon: FaGithub, className: 'text-gray-800' },
  { name: 'twitter', Icon: FaTwitter, className: 'text-blue-400' },
  { name: 'youtube', Icon: FaYoutube, className: 'text-red-600' },
  { name: 'facebook', Icon: FaFacebook, className: 'text-blue-700' },
  { name: 'instagram', Icon: FaInstagram, className: 'text-pink-600' },
  { name: 'website', Icon: FaGlobe, className: 'text-green-600' },
];
