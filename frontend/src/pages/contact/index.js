import { useState, useEffect } from "react";
import PageHead from "@/components/common/PageHead";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import styles from "./contact.module.scss";

import { fetchContactConfig, sendContactMessage } from "@/services/contactService";
const defaultSettings = {
  email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@example.com",
  phone: "+1 555-1234",
  addressLine: "123 Remote Learning Ave",
  city: "EdTech City",
  country: "USA",
  mapEmbedUrl: "https://maps.google.com/maps?q=Empire%20State%20Building&t=&z=13&ie=UTF8&iwloc=&output=embed"
};

export default function ContactPage() {
  const [settings, setSettings] = useState(defaultSettings);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchContactConfig();
        if (data) setSettings(prev => ({ ...prev, ...data }));
      } catch (err) {
        console.error("Failed to load contact settings", err);
      }
    };
    load();
  }, []);
  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await sendContactMessage(form);
      setSubmitted(true);
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  return (
    <>
      <PageHead title="Contact Us" />

      <div className={styles.page}>
        <Navbar />

        <div className={styles.container}>
          <h1 className={styles.title}>
            🗣️ Contact Us
          </h1>

          <div className={styles.grid}>
            {/* Contact Info + Map */}
            <div className={styles.card}>
              <div className={styles.info}>
                <p>
                  <strong>Email:</strong> {settings.email}
                </p>
                <p>
                  <strong>Phone:</strong> {settings.phone}
                </p>
                <p>
                  <strong>Address:</strong><br />
                  {settings.addressLine}<br />
                  {settings.city}, {settings.country}
                </p>
              </div>
              <div className={styles.iframeWrap}>
                <iframe
                  src={settings.mapEmbedUrl}
                  width="100%"
                  height="250"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                ></iframe>
              </div>
            </div>

            {/* Contact Form */}
            <form onSubmit={handleSubmit} className={styles.card}>
              <div>
                <label className={styles.label}>Your Name</label>
                <input
                  type="text"
                  className={styles.input}
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                />
              </div>
              <div>
                <label className={styles.label}>Your Email</label>
                <input
                  type="email"
                  className={styles.input}
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  required
                />
              </div>
              <div>
                <label className={styles.label}>Message</label>
                <textarea
                  rows="5"
                  className={styles.textarea}
                  value={form.message}
                  onChange={(e) => handleChange("message", e.target.value)}
                  required
                ></textarea>
              </div>
              <button
                type="submit"
                className={styles.button}
              >
                Send Message
              </button>
              {submitted && (
                <p className={styles.success}>✅ Your message was sent successfully.</p>
              )}
            </form>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}

import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../next-i18next.config.js';

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'], nextI18NextConfig)),
    },
  };
}
