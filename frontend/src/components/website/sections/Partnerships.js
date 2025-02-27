import { motion } from "framer-motion";
import Image from "next/image";

// Dummy Partner Logos
const partners = [
  { id: 1, name: "Google", logo: "/partners/google.png" },
  { id: 2, name: "Microsoft", logo: "/partners/microsoft.png" },
  { id: 3, name: "Harvard", logo: "/partners/harvard.png" },
  { id: 4, name: "Stanford", logo: "/partners/stanford.png" },
  { id: 5, name: "MIT", logo: "/partners/mit.png" },
  { id: 6, name: "IBM", logo: "/partners/ibm.png" },
];

const Partnerships = () => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      viewport={{ once: true }}
    >
      <section className="py-16 bg-gray-900 text-white text-center">
        <h2 className="text-4xl font-bold mb-6">Trusted by Leading Institutions 🤝</h2>
        <p className="text-lg text-gray-400 mb-10">
          Collaborating with top universities, tech companies, and research institutions.
        </p>

        {/* Scrolling Marquee Effect */}
        <div className="overflow-hidden">
          <motion.div
            className="flex space-x-12 animate-marquee"
            initial={{ x: "100%" }}
            animate={{ x: "-100%" }}
            transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
          >
            {partners.map((partner) => (
              <motion.div
                key={partner.id}
                whileHover={{ scale: 1.1 }}
                className="w-36 h-20 flex items-center justify-center bg-gray-800 rounded-lg shadow-lg p-4"
              >
                <Image src={partner.logo} alt={partner.name} width={120} height={60} className="object-contain" />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </motion.section>



  );
};

export default Partnerships;
