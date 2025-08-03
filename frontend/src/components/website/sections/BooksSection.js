import { useTranslation } from "next-i18next";
import { motion } from "framer-motion";

const BooksSection = () => {
  const { t } = useTranslation('website');
  return (
    <section className="bg-gray-950 py-16 text-white text-center">
      <motion.h2
        className="text-3xl sm:text-4xl font-bold text-yellow-400 mb-4"
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        📖 {t('explore_books')}
      </motion.h2>
      <p className="text-gray-300 mb-8">Discover our curated selection of books.</p>
      <motion.a
        href="/marketplace/books"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="inline-block bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-3 rounded-full font-semibold transition"
      >
        {t('explore_books')}
      </motion.a>
    </section>
  );
};

export default BooksSection;

