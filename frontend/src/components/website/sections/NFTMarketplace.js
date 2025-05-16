import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { FaEthereum, FaShoppingCart, FaSearch } from "react-icons/fa";

const nftData = [
  { id: 1, title: "AI-Generated Study Guide", category: "Study Guide", price: 0.12, image: "/shared/assets/images/nft/nft1.jpg" },
  { id: 2, title: "Exclusive Course Certificate", category: "Certificates", price: 0.18, image: "/shared/assets/images/nft/nft2.jpg" },
  { id: 3, title: "Premium Learning Material", category: "Research Papers", price: 0.22, image: "/shared/assets/images/nft/nft3.jpg" },
  { id: 4, title: "Advanced AI Notes", category: "Study Guide", price: 0.15, image: "/shared/assets/images/nft/nft4.jpg" },
  { id: 5, title: "Blockchain Research Paper", category: "Research Papers", price: 0.30, image: "/shared/assets/images/nft/nft5.jpg" },
  { id: 6, title: "Machine Learning Dataset", category: "Data Science", price: 0.25, image: "/shared/assets/images/nft/nft6.jpg" },
  { id: 7, title: "Medical Research Study", category: "Medicine", price: 0.40, image: "/shared/assets/images/nft/nft7.jpg" },
  { id: 8, title: "Cybersecurity Handbook", category: "Cybersecurity", price: 0.10, image: "/shared/assets/images/nft/nft8.jpg" },
];

const categories = ["All", "Study Guide", "Certificates", "Research Papers", "Data Science", "Medicine", "Cybersecurity"];

const NFTMarketplace = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(6); // Show first 6 NFTs

  // Filter NFTs
  const filteredNFTs = nftData
    .filter((nft) => selectedCategory === "All" || nft.category === selectedCategory)
    .filter((nft) => nft.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      viewport={{ once: true }}
    >
      <section className="relative w-full py-20 bg-gray-900 text-white text-center">
        <div className="max-w-7xl mx-auto px-6">

          {/* Section Heading */}
          <motion.h2 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}
            className="text-4xl md:text-5xl font-extrabold text-yellow-400 mb-6">
            Own & Trade Unique Educational Content with NFTs
          </motion.h2>
          <p className="text-lg text-gray-300 mb-6">
            Mint, buy, and sell educational NFTs, including study guides, verified certificates, and research papers.
          </p>

          {/* Search & Filters */}
          <div className="flex flex-wrap justify-center items-center gap-4 mb-8">

            {/* Search Bar */}
            <div className="relative w-full max-w-lg">
              <input type="text" placeholder="Search NFTs..." value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-3 pl-10 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-500 focus:outline-none text-gray-900 shadow-lg" />
              <FaSearch className="absolute left-3 top-4 text-gray-600 text-xl" />
            </div>

            {/* Category Dropdown */}
            <select className="p-3 border border-gray-300 rounded-lg bg-gray-800 text-white shadow-lg"
              value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
              {categories.map((category) => (<option key={category} value={category}>{category}</option>))}
            </select>
          </div>

          {/* NFT Grid (Show up to `visibleCount` NFTs) */}
          
          

          {/* Show More Button */}
          {visibleCount < filteredNFTs.length && (
            <motion.button whileHover={{ scale: 1.05 }}
              className="mt-8 px-8 py-3 bg-yellow-500 text-gray-900 text-lg font-bold rounded-lg shadow-lg hover:bg-yellow-600 transition"
              onClick={() => setVisibleCount(visibleCount + 6)}>
              Show More NFTs
            </motion.button>
          )}

        </div>
      </section>
    </motion.section>



  );
};

export default NFT ;
