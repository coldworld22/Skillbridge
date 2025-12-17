import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { FaSearch, FaTag, FaUserGraduate, FaChalkboardTeacher, FaPlus } from "react-icons/fa";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import { fetchOffers } from "@/services/offerService";
import styles from "./offers.module.scss";

const tagColors = {
  Urgent: "#ef4444",
  OneOnOne: "#93c5fd",
  Discount: "#86efac",
  Flexible: "#c4b5fd",
  LiveClass: "#f9a8d4",
};

const OfferBadge = ({ type }) => (
  <span
    className={`${styles.badge} ${
      type === "student" ? styles.studentBadge : styles.instructorBadge
    }`}
  >
    {type === "student" ? "Student Request" : "Instructor Offer"}
  </span>
);

const OffersPage = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortOption, setSortOption] = useState("date_desc");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchOffers();
        const normalized = data.map((o) => ({
          id: o.id,
          title: o.title,
          type: o.offer_type === "class" ? "instructor" : "student",
          price: o.budget || "",
          duration: o.timeframe || "",
          tags: o.tags?.map((t) => t.name) || [],
          date: o.created_at || o.updated_at || new Date().toISOString(),
        }));
        setOffers(normalized);
      } catch (err) {
        setError("Failed to load offers");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = offers
    .filter(
      (offer) =>
        offer.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        (filterType === "all" || offer.type === filterType)
    )
    .sort((a, b) => {
      const priceA = parseFloat(String(a.price).replace(/[^0-9.-]+/g, "")) || 0;
      const priceB = parseFloat(String(b.price).replace(/[^0-9.-]+/g, "")) || 0;
      switch (sortOption) {
        case "price_asc":
          return priceA - priceB;
        case "price_desc":
          return priceB - priceA;
        case "date_asc":
          return new Date(a.date) - new Date(b.date);
        default:
          return new Date(b.date) - new Date(a.date);
      }
    });

  return (
    <div className={styles.page}>
      <Navbar />

      <section className={styles.hero}>
        <div className={styles.container}>
          <motion.h1
            className={styles.title}
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            📢 All Learning Offers
          </motion.h1>

          <p className={styles.subtitle}>
            Explore student requests and instructor offers.
          </p>

          <p className={styles.meta}>
            Showing {filtered.length} {filterType === "all" ? "offers" : `${filterType} offers`}
          </p>

          {/* Filter Buttons */}
          <div className={styles.filters}>
            {[
              { label: "All", value: "all" },
              { label: "Students", value: "student" },
              { label: "Instructors", value: "instructor" },
            ].map((btn) => (
              <button
                key={btn.value}
                onClick={() => setFilterType(btn.value)}
                className={`${styles.filterBtn} ${
                  filterType === btn.value ? styles.filterActive : ""
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Sort Options */}
          <div className={styles.sortWrap}>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className={styles.sortSelect}
            >
              <option value="date_desc">Newest</option>
              <option value="date_asc">Oldest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>

          {/* Search */}
          <div className={styles.searchWrap}>
            <FaSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search offers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          {/* Offers Grid */}
          <div className={styles.grid}>
            {loading ? (
              <div className={styles.loading}>Loading offers...</div>
            ) : error ? (
              <div className={styles.error}>{error}</div>
            ) : filtered.length > 0 ? (
              filtered.map((offer, index) => (
                <motion.div
                  key={offer.id}
                  whileHover={{ scale: 1.03 }}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                  className={styles.card}
                  onClick={() => router.push(`/offers/${offer.id}`)}
                >
                  <div className={styles.cardHeader}>
                    <div className={styles.iconHolder}>
                      {offer.type === "student" ? (
                        <FaUserGraduate className={styles.iconPrimary} />
                      ) : (
                        <FaChalkboardTeacher className={styles.iconSecondary} />
                      )}
                    </div>
                    <OfferBadge type={offer.type} />
                  </div>
                  <h3 className={styles.cardTitle}>{offer.title}</h3>
                  <p className={styles.cardMeta}>
                    {new Date(offer.date).toLocaleDateString()}
                  </p>
                  <p className={styles.cardSub}>
                    <strong>Duration:</strong> {offer.duration}
                  </p>
                  <p className={styles.cardSub}>
                    <strong>Price:</strong> {offer.price}
                  </p>
                  <div className={styles.tagList}>
                    {offer.tags.map((tag, index) => (
                      <span
                        key={index}
                        className={styles.tag}
                        style={{ background: tagColors[tag] || "#fbbf24" }}
                      >
                        <FaTag className={styles.tagIcon} /> {tag}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className={styles.empty}>
                😕 No offers found. Try a different search.
              </div>
            )}
          </div>

          {/* CTA */}
          <div className={styles.cta}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/offers/new")}
              className={styles.ctaButton}
            >
              <FaPlus /> Post an Offer
            </motion.button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default OffersPage;

import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../next-i18next.config.js';

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'], nextI18NextConfig)),
    },
  };
}
