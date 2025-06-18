import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Typewriter from "typewriter-effect";
import SearchBar from "@/components/shared/SearchBar";
import { useSwipeable } from "react-swipeable"; // ✅ New for mobile swipe
import {
  FaBars, FaRobot, FaSearch, FaArrowRight, FaChalkboardTeacher,
  FaBookOpen, FaMouse, FaChevronLeft, FaChevronRight, FaQuestionCircle
} from "react-icons/fa";
import SidebarMenu from "@/components/shared/SidebarMenu";
import Chatbot from "@/components/shared/Chatbot";
import heroImage from "@/shared/assets/images/home/hero.png";
import { getAds } from "@/services/adsService";

const defaultAds = [
  {
    id: 1,
    title: "🔥 Black Friday Deal: 50% Off!",
    description: "All courses now at half price!",
    image: "/shared/assets/images/ads/black-friday.jpg",
    link: "/promotions/1"
  },
  {
    id: 2,
    title: "📢 Python Bootcamp Enrollment Open!",
    description: "Join our advanced Python bootcamp!",
    image: "/shared/assets/images/ads/python-bootcamp.jpg",
    link: "/promotions/2"
  },
  {
    id: 3,
    title: "🚀 AI Masterclass Discount!",
    description: "Learn AI from top instructors!",
    image: "/shared/assets/images/ads/ai-masterclass.jpg",
    link: "/promotions/3"
  },
];


const Hero = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [ads, setAds] = useState(defaultAds);
  const [currentAd, setCurrentAd] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState([]);

  const typewriterText = ["Empower Learning", "Connect Minds", "Master New Skills"];

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const data = await getAds();
        if (data.length) setAds(data);
      } catch (err) {
        console.error("Failed to fetch ads", err);
      }
    };
    fetchAds();
  }, []);

  // Auto-rotate Ads Every 5 Seconds
  useEffect(() => {
    if (!ads.length) return;
    const interval = setInterval(() => {
      setCurrentAd((prev) => (prev + 1) % ads.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [ads]);

  // Search Suggestions
  useEffect(() => {
    if (searchText.length > 2) {
      setSearchSuggestions([
        "React for Beginners",
        "Mastering Python",
        "Data Science Bootcamp",
        "UX/UI Design Fundamentals",
      ]);
    } else {
      setSearchSuggestions([]);
    }
  }, [searchText]);

  // Handle Ad Navigation
  const prevAd = () => setCurrentAd((prev) => (prev === 0 ? ads.length - 1 : prev - 1));
  const nextAd = () => setCurrentAd((prev) => (prev + 1) % ads.length);

  // Swipe gestures for mobile
  const handlers = useSwipeable({
    onSwipedLeft: nextAd,
    onSwipedRight: prevAd,
    trackMouse: true,
  });

  const handleSearchSelect = (selectedValue) => {
    setSearchText(selectedValue);
    alert(`Navigating to results for: ${selectedValue}`); // Replace with real navigation
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      viewport={{ once: true }}
    >
      <section className="relative w-full min-h-screen flex flex-col lg:flex-row items-center justify-between text-gray-900 overflow-hidden px-6">

        {/* Sidebar & Chatbot */}
        <SidebarMenu isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <Chatbot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

        {/* Floating Sidebar Button */}
        <motion.button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="fixed left-4 top-1/2 transform -translate-y-1/2 bg-yellow-500 text-gray-900 p-4 rounded-r-full shadow-xl hover:bg-yellow-600 transition z-50 flex items-center gap-2"
          whileHover={{ scale: 1.2, rotate: 5 }}
        >
          <FaBars size={22} />
        </motion.button>

        {/* Floating Chatbot Button */}
        <motion.button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="fixed right-4 top-1/2 transform -translate-y-1/2 bg-yellow-500 text-gray-900 p-4 rounded-l-full shadow-xl hover:bg-yellow-600 transition z-50 flex items-center gap-2"
          whileHover={{ scale: 1.2, rotate: -5 }}
        >
          <FaRobot size={22} />
        </motion.button>

        {/* Background Image with Overlay */}
        <div className="absolute inset-0 w-full h-full">
          <Image src={heroImage} alt="Learning Illustration" layout="fill" objectFit="cover" priority />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent"></div>
        </div>

        {/* Left Content */}
        <div className="relative z-10 text-center lg:text-left lg:w-1/2">
          <motion.h1 className="text-4xl md:text-6xl font-extrabold mb-6 text-white drop-shadow-lg">
            <Typewriter options={{ strings: typewriterText, autoStart: true, loop: true }} />
          </motion.h1>

          {/* 🔍 Modern Search Box */}
          <div className="relative w-full max-w-lg mx-auto mb-6">
            <SearchBar value={searchText} onChange={setSearchText} onSelect={handleSearchSelect} />
          </div>

          {/* CTA Buttons */}
          <motion.div className="flex flex-wrap justify-center gap-4">

            <Link href="/community">
              <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition shadow-lg flex items-center gap-2">
                <FaQuestionCircle /> Ask a Question
              </button>
            </Link>

            <Link href="/online-classes">
              <button className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition shadow-lg flex items-center gap-2">
                <FaChalkboardTeacher /> Browse Online Classes
              </button>
            </Link>

            <Link href="/tutorials">
              <button className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition shadow-lg flex items-center gap-2">
                <FaBookOpen /> Explore Tutorials
              </button>
            </Link>
          </motion.div>
        </div>

        {/* Right Side - Ads */}
        <AnimatePresence mode="wait">
          <motion.div
            key={ads[currentAd].id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5 }}
            className="relative w-full lg:w-1/2 min-h-[450px] rounded-lg overflow-hidden shadow-2xl"


            {...handlers}
          >
            <Image
              src={ads[currentAd].image}
              alt={ads[currentAd].title}
              layout="fill"
              objectFit="cover"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-black/60 flex flex-col justify-center items-start px-6 py-10 md:px-10 md:py-12 text-white z-10">
              <div className="max-w-md">
                <h3 className="text-2xl md:text-4xl font-bold mb-2 drop-shadow-lg">{ads[currentAd].title}</h3>
                <p className="text-base md:text-xl mb-4 drop-shadow">{ads[currentAd].description}</p>
                <a
                  href={ads[currentAd].link}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-yellow-500 text-black rounded hover:bg-yellow-600 transition font-semibold"
                >
                  Learn More <FaArrowRight />
                </a>
              </div>
            </div>


            {/* Ad Navigation Arrows */}
            <div className="absolute top-1/2 left-4 transform -translate-y-1/2 z-20">
              <button onClick={prevAd} className="p-2 bg-gray-800/70 hover:bg-gray-700 rounded-full text-white">
                <FaChevronLeft />
              </button>
            </div>
            <div className="absolute top-1/2 right-4 transform -translate-y-1/2 z-20">
              <button onClick={nextAd} className="p-2 bg-gray-800/70 hover:bg-gray-700 rounded-full text-white">
                <FaChevronRight />
              </button>
            </div>

            {/* Dot Indicators */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
              {ads.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentAd(index)}
                  className={`w-3 h-3 rounded-full ${currentAd === index ? "bg-yellow-500" : "bg-white/50"}`}
                />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>


        {/* ✅ Mouse Scroll Indicator (ADDED) */}
        <motion.div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
          <FaMouse className="text-white text-3xl animate-bounce" />
          <p className="text-white text-sm mt-2">Scroll Down</p>
        </motion.div>
      </section>
    </motion.section>
  );
};

export default Hero;
