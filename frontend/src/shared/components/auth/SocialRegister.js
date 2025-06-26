// 📁 src/shared/components/auth/SocialRegister.js
import { FaGoogle, FaFacebook, FaApple } from "react-icons/fa";
import { motion } from "framer-motion";

const providers = [
  { name: "Google", icon: FaGoogle },
  { name: "Facebook", icon: FaFacebook },
  { name: "Apple", icon: FaApple },
];

export default function SocialRegister() {
  const handleSocialClick = (provider) => {
    console.log(`🔐 Sign up with ${provider}`);
    alert(`Simulate OAuth with ${provider}`);
  };

  return (
    <div className="mt-4 flex space-x-4 w-full justify-center">
      {providers.map(({ name, icon: Icon }) => (
        <motion.button
          key={name}
          whileHover={{ scale: 1.1 }}
          className="w-14 h-14 flex items-center justify-center bg-yellow-500 text-white rounded-full hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
          onClick={() => handleSocialClick(name)}
        >
          <Icon size={28} />
        </motion.button>
      ))}
    </div>
  );
}
