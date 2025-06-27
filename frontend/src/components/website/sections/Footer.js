import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import GoogleAd from "@/components/shared/GoogleAd";
import { API_BASE_URL } from "@/config/config";
import useAppConfigStore from "@/store/appConfigStore";
import { 
  FaFacebook, FaTwitter, FaLinkedin, FaInstagram, FaYoutube, 
  FaEnvelope, FaPhone, FaMapMarkerAlt, FaCcVisa, FaCcMastercard, 
  FaPaypal, FaCcApplePay, FaCcAmazonPay, FaArrowUp, FaWhatsapp
} from "react-icons/fa";

const Footer = () => {
  const [showScroll, setShowScroll] = useState(false);
  const [email, setEmail] = useState("");
  const settings = useAppConfigStore((state) => state.settings);
  const fetchAppConfig = useAppConfigStore((state) => state.fetch);

  useEffect(() => {
    fetchAppConfig();
  }, [fetchAppConfig]);

  useEffect(() => {
    const checkScrollTop = () => {
      setShowScroll(window.scrollY > 200);
    };
    window.addEventListener("scroll", checkScrollTop);
    return () => window.removeEventListener("scroll", checkScrollTop);
  }, []);

  // Scroll to Top Function
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-gradient-to-r from-gray-800 to-yellow-500 text-gray-100 py-12 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        
        {/* Animated Footer Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-10">
            
            {/* About Section */}
            <div>
              <h3 className="text-lg font-bold mb-4 text-yellow-400">About {settings.appName || 'SkillBridge'}</h3>
              <p className="text-sm leading-relaxed">
                {settings.metaDescription || 'SkillBridge connects learners with expert instructors worldwide.'}
              </p>
              <div className="flex space-x-4 mt-4">
                {[{ href: "https://facebook.com", icon: <FaFacebook /> },
                  { href: "https://twitter.com", icon: <FaTwitter /> },
                  { href: "https://linkedin.com", icon: <FaLinkedin /> },
                  { href: "https://instagram.com", icon: <FaInstagram /> },
                  { href: "https://youtube.com", icon: <FaYoutube /> }].map(({ href, icon }, index) => (
                  <Link key={index} href={href} className="text-2xl hover:text-yellow-300 transition">
                    {icon}
                  </Link>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-bold mb-4 text-yellow-400">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                {["about", "contact", "FAQs", "Blog", "Support"].map((item, index) => (
                  <li key={index}>
                    <Link href={`/${item.toLowerCase().replace(/\s/g, "-")}`} className="hover:text-yellow-300 transition">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Sitemap */}
            <div>
              <h3 className="text-lg font-bold mb-4 text-yellow-400">Sitemap</h3>
              <ul className="space-y-2 text-sm">
                {["Courses", "Instructors", "Community", "Careers"].map((item, index) => (
                  <li key={index}>
                    <Link href={`/${item.toLowerCase()}`} className="hover:text-yellow-300 transition">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Section */}
            <div>
              <h3 className="text-lg font-bold mb-4 text-yellow-400">Contact Us</h3>
              <ul className="space-y-2 text-sm">
                {[{ icon: <FaEnvelope />, text: "support@skillbridge.com" },
                  { icon: <FaPhone />, text: "+1 (555) 123-4567" },
                  { icon: <FaMapMarkerAlt />, text: "123 Learning St, New York, USA" }].map(({ icon, text }, index) => (
                  <li key={index} className="flex items-center gap-2">
                    {icon} {text}
                  </li>
                ))}
              </ul>
            </div>
            
          </div>
        </motion.div>

        {/* Newsletter Subscription */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mt-10 text-center"
        >
          <h3 className="text-lg font-bold text-yellow-400">Subscribe to Our Newsletter</h3>
          <div className="flex flex-col md:flex-row justify-center items-center gap-4 mt-4">
            <input 
              type="email" 
              placeholder="Enter your email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="p-3 w-full max-w-lg rounded-lg border border-gray-500 text-gray-900 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
            />
            <button className="bg-yellow-500 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-yellow-600 transition">
              Subscribe
            </button>
          </div>
        </motion.div>

        

        {/* Payment Methods */}
        <div className="mt-8 flex flex-col items-center">
          <h3 className="text-lg font-bold mb-2 text-yellow-400">Accepted Payments</h3>
          <div className="flex space-x-4 text-3xl text-gray-300">
            <FaCcVisa />
            <FaCcMastercard />
            <FaPaypal />
            <FaCcApplePay />
            <FaCcAmazonPay />
          </div>
        </div>

         {/* Google AdSense Ads (If Enabled) */}
         {/* {showAds && ( */}
          <div className="mt-6 text-center">
            {/* <h4 className="text-lg font-bold text-yellow-400 flex items-center gap-2 justify-center">
              <FaBullhorn /> Sponsored Ads
            </h4> */}
            <div className="text-center">
              {/* Google AdSense Ad Slot */}
              {/* <ins className="adsbygoogle"
                style={{ display: "block" }}
                data-ad-client="ca-pub-xxxxxxxxxxxxxxxx"
                data-ad-slot="1234567890"
                data-ad-format="auto"
                data-full-width-responsive="true">
              </ins> */}
            </div>
          </div>
        {/* )}
         */}

        {/* Divider */}
        <hr className="border-gray-700 my-6" />

        {/* Copyright Section */}
        <div className="text-center text-sm">
          <p>&copy; {new Date().getFullYear()} {settings.appName || 'SkillBridge'}. All rights reserved.</p>
          <div className="flex justify-center space-x-6 mt-2">
            <Link href="/privacy-policy" className="hover:text-yellow-300 transition">Privacy Policy</Link>
            <span>|</span>
            <Link href="/terms" className="hover:text-yellow-300 transition">Terms of Service</Link>
          </div>
        </div>

      </div>

     

      {/* WhatsApp Button (For Direct Contact) */}
      <motion.a 
        whileHover={{ scale: 1.2 }} 
        href="https://wa.me/15551234567" // Change this to your WhatsApp number
        target="_blank"
        className="fixed bottom-10 left-8 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition z-50"
      >
        <FaWhatsapp size={24} />
      </motion.a>

    </footer>
  );
};

export default Footer;
