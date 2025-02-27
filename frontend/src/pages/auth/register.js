import { useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import Image from "next/image";
import logo from "@/shared/assets/images/login/logo.png";
import { FaGoogle, FaFacebook, FaApple, FaCheckCircle, FaTimesCircle, FaEye, FaEyeSlash } from "react-icons/fa";
import BackgroundAnimation from "@/shared/components/auth/BackgroundAnimation";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userType, setUserType] = useState("Student");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const [isSuccess, setIsSuccess] = useState(false);


  // Validation State
  const [emailTouched, setEmailTouched] = useState(false);
  const [nameTouched, setNameTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const nameValid = name.trim().length >= 3;
  const passwordRules = {
    length: password.length >= 8,
    capital: /[A-Z]/.test(password),
    specialChar: /[\W_]/.test(password),
  };
  const passwordsMatch = confirmPassword === password;
  

  const handleRegister = () => {
    if (!passwordsMatch || !emailValid || !nameValid) {
      alert("Please complete the form correctly!");
      return;
    }
    setIsSuccess(true); // Show success modal
    setTimeout(() => {
      router.push("/auth/login"); // Redirect to login
    }, 2000);
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gray-900">
      {/* Background Animation */}
      <BackgroundAnimation />

      {/* Register Container */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.03, boxShadow: "0px 10px 30px rgba(234, 179, 8, 0.2)" }}
        transition={{ duration: 0.4 }}
        className="relative bg-gray-800 rounded-lg shadow-lg p-8 w-96 border border-gray-700 text-white flex flex-col items-center"
      >
        {/* Circular Logo with Border */}
        <div className="w-24 h-24 rounded-full border-4 border-yellow-500 bg-gray-900 flex items-center justify-center mb-4 shadow-lg">
          <Image src={logo} alt="SkillBridge Logo" width={80} height={80} priority className="rounded-full" />
        </div>

        <h2 className="text-2xl font-bold text-center text-yellow-400 mb-6">
          Create an Account 🎓
        </h2>

        {/* User Type Selection */}
        <div className="flex justify-between bg-gray-700 rounded-lg p-2 mb-4 w-full">
          {["Student", "Instructor", "User"].map((type) => (
            <motion.button
              key={type}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
              onClick={() => setUserType(type)}
              className={`px-4 py-2 font-semibold text-sm rounded-md transition w-1/3 ${userType === type ? "bg-yellow-500 text-gray-900" : "text-gray-400 hover:bg-gray-600"
                }`}
            >
              {type}
            </motion.button>
          ))}
        </div>

        {/* Name Input */}
        <div className="mt-4 w-full">
          <label className="block text-gray-400">Full Name</label>
          <div className="relative">
            <input
              type="text"
              className="w-full px-3 py-2 mt-2 border rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-yellow-500"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={() => setNameTouched(true)}
            />
            {nameTouched && (
              <span className="absolute right-3 top-3">
                {nameValid ? <FaCheckCircle className="text-yellow-500" /> : <FaTimesCircle className="text-red-500" />}
              </span>
            )}
          </div>
        </div>

        {/* Email Input */}
        <div className="mt-4 w-full">
          <label className="block text-gray-400">Email</label>
          <div className="relative">
            <input
              type="email"
              className="w-full px-3 py-2 mt-2 border rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-yellow-500"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setEmailTouched(true)}
            />
            {emailTouched && (
              <span className="absolute right-3 top-3">
                {emailValid ? <FaCheckCircle className="text-yellow-500" /> : <FaTimesCircle className="text-red-500" />}
              </span>
            )}
          </div>
        </div>

        {/* Password Input with Toggle */}
        <div className="mt-4 w-full">
          <label className="block text-gray-400">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              className="w-full px-3 py-2 mt-2 border rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-yellow-500"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setPasswordTouched(true)}
            />
            <span className="absolute right-3 top-3 cursor-pointer" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <FaEyeSlash className="text-gray-400" /> : <FaEye className="text-gray-400" />}
            </span>
          </div>
          {passwordTouched && (
            <ul className="text-xs text-yellow-500 mt-2">
              <li>{passwordRules.length ? "✔ At least 8 characters" : "❌ At least 8 characters"}</li>
              <li>{passwordRules.capital ? "✔ One uppercase letter" : "❌ One uppercase letter"}</li>
              <li>{passwordRules.specialChar ? "✔ One special character" : "❌ One special character"}</li>
            </ul>
          )}
        </div>

        {/* Confirm Password Input with Toggle */}
        <div className="mt-4 w-full">
          <label className="block text-gray-400">Confirm Password</label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              className="w-full px-3 py-2 mt-2 border rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-yellow-500"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onFocus={() => setConfirmPasswordTouched(true)}
            />
            <span className="absolute right-3 top-3 cursor-pointer" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
              {showConfirmPassword ? <FaEyeSlash className="text-gray-400" /> : <FaEye className="text-gray-400" />}
            </span>
          </div>
          <motion.button whileHover={{ scale: 1.05 }} className="w-full mt-6 bg-yellow-500 text-gray-900 py-2 rounded-lg hover:bg-yellow-600 transition font-semibold" onClick={handleRegister}>Register</motion.button>
        </div>

        {/* Divider */}
        <div className="mt-4 text-center text-gray-500">or continue with</div>

        {/* Circular Social Login Buttons */}
        <div className="mt-4 flex space-x-4">
          <motion.button
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.3 }}
            className="w-14 h-14 flex items-center justify-center bg-yellow-500 text-white rounded-full hover:bg-yellow-600 transition"
          >
            <FaGoogle size={28} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.3 }}
            className="w-14 h-14 flex items-center justify-center bg-yellow-500 text-white rounded-full hover:bg-yellow-600 transition"
          >
            <FaFacebook size={28} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.3 }}
            className="w-14 h-14 flex items-center justify-center bg-yellow-500 text-white rounded-full hover:bg-yellow-600 transition"
          >
            <FaApple size={28} />
          </motion.button>
        </div>
        

        {/* Sign Up Link */}
        <p className="text-center mt-6 text-gray-400">
          Already have an account?{" "}
          <a href="/auth/login" className="text-yellow-400 hover:underline">
            Login
          </a>
        </p>
      </motion.div>
    </div>
  );
}
