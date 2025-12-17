import { useState } from "react";
import { useRouter } from "next/router";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import { FaTag } from "react-icons/fa";
import { toast } from "react-toastify";
import { createOffer } from "@/services/offerService";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../next-i18next.config.js";
import styles from "./offers.module.scss";

const availableTags = ["Urgent", "LiveClass", "Discount", "Flexible", "OneOnOne"];

const CreateOffer = () => {
  const router = useRouter();
  const [offerType, setOfferType] = useState("student");
  const [offerCategory, setOfferCategory] = useState("class");
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createOffer({
        title,
        description,
        budget: price,
        timeframe: duration,
        offer_type: offerCategory,
        tags: JSON.stringify(tags),
      });
      toast.success("🎉 Offer posted successfully!", { theme: "dark" });
      setTimeout(() => router.push("/offers"), 1800);
    } catch (err) {
      toast.error("Failed to post offer", { theme: "dark" });
    }
  };

  const toggleTag = (tag) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className={styles.page}>
      <Navbar />
      <section className={styles.hero}>
        <div className={styles.formCard}>
          <h1 className={styles.formTitle}>
            📌 Post a New Offer
          </h1>

          <form
            onSubmit={handleSubmit}
            className={styles.formBody}
          >
            {/* User Type */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>I am a:</label>
              <select
                className={styles.formControl}
                value={offerType}
                onChange={(e) => setOfferType(e.target.value)}
              >
                <option value="student">Student (Looking for a tutor)</option>
                <option value="instructor">Instructor (Offering lessons)</option>
              </select>
            </div>

            {/* Offer Type */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Offer Type:</label>
              <select
                className={styles.formControl}
                value={offerCategory}
                onChange={(e) => setOfferCategory(e.target.value)}
              >
                <option value="class">Class</option>
                <option value="tutorial">Tutorial</option>
              </select>
            </div>

            {/* Title */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Course Title:</label>
              <input
                type="text"
                className={styles.formControl}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Duration and Price */}
            <div className={styles.gridTwo}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Duration:</label>
                <input
                  type="text"
                  className={styles.formControl}
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Price:</label>
                <input
                  type="text"
                  className={styles.formControl}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Description:</label>
              <textarea
                className={styles.formControl}
                rows="4"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              ></textarea>
            </div>

            {/* Tags */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Tags:</label>
              <div className={styles.tagListForm}>
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`${styles.tagBtn} ${tags.includes(tag) ? styles.tagBtnActive : ""}`}
                  >
                    <FaTag /> {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className={styles.submit}
            >
              📍 Submit Offer
            </button>
          </form>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default CreateOffer;

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"], nextI18NextConfig)),
    },
  };
}
