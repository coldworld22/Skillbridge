import { motion } from "framer-motion";
import { FaRocket, FaBookOpen } from "react-icons/fa";
import { useTranslation } from "next-i18next";

const CallToAction = () => {
  const { t } = useTranslation("website");
  return (

    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      viewport={{ once: true }}
    >
      <section className="relative w-full py-20 bg-gradient-to-r from-yellow-500 to-yellow-600 text-gray-900 text-center">
        {/* Animated Background (Floating Circles) */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute w-32 h-32 bg-white/20 rounded-full top-10 left-10"
            animate={{ y: [0, 20, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute w-40 h-40 bg-white/10 rounded-full bottom-10 right-10"
            animate={{ y: [0, 20, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
          />
        </div>

        {/* CTA Content */}
        <div className="relative z-10 max-w-3xl mx-auto px-6">
          <h2 className="text-4xl font-bold mb-4">{t("cta_heading")}</h2>
          <p className="text-lg text-gray-800 mb-8">{t("cta_text")}</p>

          {/* CTA Buttons */}
          <div className="flex justify-center gap-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              className="px-6 py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition shadow-lg flex items-center gap-2"
            >
              <FaRocket /> {t("cta_sign_up")}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              className="px-6 py-3 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-200 transition shadow-lg flex items-center gap-2"
            >
              <FaBookOpen /> {t("cta_explore_courses")}
            </motion.button>
          </div>
        </div>
      </section>
    </motion.section>



  );
};

export default CallToAction;
