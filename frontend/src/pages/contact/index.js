import { useState } from "react";
import PageHead from "@/components/common/PageHead";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";

const mockSettings = {
  email: "support@skillbridge.com",
  phone: "+1 555-1234",
  addressLine: "123 Remote Learning Ave",
  city: "EdTech City",
  country: "USA",
  mapEmbedUrl: "https://maps.google.com/maps?q=Empire%20State%20Building&t=&z=13&ie=UTF8&iwloc=&output=embed"
};

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", form);
    setSubmitted(true);
    // TODO: Send to backend
  };

  return (
    <>
      <PageHead title="Contact Us" />

      <div className="bg-gray-900 min-h-screen text-white">
        <Navbar />

        <div className="container mx-auto px-6 py-10">
          <h1 className="text-4xl font-bold text-yellow-500 text-center mb-14">
            🗣️ Contact Us
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Contact Info + Map */}
            <div className="space-y-4">
              <div>
                <p className="text-lg">
                  <strong>Email:</strong> {mockSettings.email}
                </p>
                <p className="text-lg">
                  <strong>Phone:</strong> {mockSettings.phone}
                </p>
                <p className="text-lg">
                  <strong>Address:</strong><br />
                  {mockSettings.addressLine}<br />
                  {mockSettings.city}, {mockSettings.country}
                </p>
              </div>
              <div className="rounded overflow-hidden shadow-lg">
                <iframe
                  src={mockSettings.mapEmbedUrl}
                  width="100%"
                  height="250"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                ></iframe>
              </div>
            </div>

            {/* Contact Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block mb-1 font-semibold text-gray-300">Your Name</label>
                <input
                  type="text"
                  className="w-full border border-gray-600 bg-gray-800 text-white p-2 rounded"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold text-gray-300">Your Email</label>
                <input
                  type="email"
                  className="w-full border border-gray-600 bg-gray-800 text-white p-2 rounded"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold text-gray-300">Message</label>
                <textarea
                  rows="5"
                  className="w-full border border-gray-600 bg-gray-800 text-white p-2 rounded"
                  value={form.message}
                  onChange={(e) => handleChange("message", e.target.value)}
                  required
                ></textarea>
              </div>
              <button
                type="submit"
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-6 py-2 rounded"
              >
                Send Message
              </button>
              {submitted && (
                <p className="text-green-400 mt-2">✅ Your message was sent (mock).</p>
              )}
            </form>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}
