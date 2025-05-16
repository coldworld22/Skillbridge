import { motion, AnimatePresence } from "framer-motion";
import "@/styles/globals.css";
import 'react-quill/dist/quill.snow.css';



function MyApp({ Component, pageProps, router }) {
  const getLayout = Component.getLayout || ((page) => page);

  return (
    <AnimatePresence mode="wait">
      
      <motion.div
        key={router.route}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.3 }}
      >
        {getLayout(<Component {...pageProps} />)}
      </motion.div>
    </AnimatePresence>
  );
}

export default MyApp;
