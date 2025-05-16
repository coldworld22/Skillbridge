import { useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { FaPlus, FaTrash } from "react-icons/fa";

export default function FooterSettingsPage() {
  const [about, setAbout] = useState("SkillBridge connects learners with expert instructors worldwide.");
  const [socialLinks, setSocialLinks] = useState([
    { platform: "Facebook", url: "https://facebook.com" },
    { platform: "Twitter", url: "https://twitter.com" }
  ]);
  const [quickLinks, setQuickLinks] = useState(["about", "contact", "FAQs", "Blog", "Support"]);
  const [sitemap, setSitemap] = useState(["Courses", "Instructors", "Community", "Careers"]);
  const [contact, setContact] = useState({
    email: "support@skillbridge.com",
    phone: "+1 (555) 123-4567",
    address: "123 Learning St, New York, USA"
  });
  const [whatsapp, setWhatsapp] = useState("15551234567");
  const [showNewsletter, setShowNewsletter] = useState(true);
  const [footerNote, setFooterNote] = useState("All rights reserved.");
  const [adsEnabled, setAdsEnabled] = useState(false);
  const [adsClientId, setAdsClientId] = useState("ca-pub-xxxxxxxxxxxxxxxx");
  const [paymentMethods, setPaymentMethods] = useState({
    visa: true,
    mastercard: true,
    paypal: true,
    applepay: true,
    amazonpay: false
  });

  const handleSocialChange = (index, key, value) => {
    const updated = [...socialLinks];
    updated[index][key] = value;
    setSocialLinks(updated);
  };

  const handleAddSocial = () => {
    setSocialLinks([...socialLinks, { platform: "", url: "" }]);
  };

  const handleRemoveSocial = (index) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-10">
        <h1 className="text-2xl font-bold">Footer Settings</h1>

        {/* About */}
        <div>
          <label className="block font-semibold mb-2">About Description</label>
          <textarea
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            rows={4}
            className="w-full border rounded p-3 text-sm"
          />
        </div>

        {/* Social Links */}
        <div>
          <label className="block font-semibold mb-2">Social Media Links</label>
          {socialLinks.map((link, index) => (
            <div key={index} className="flex gap-4 items-center mb-2">
              <input
                placeholder="Platform (e.g., Facebook)"
                className="border p-2 flex-1"
                value={link.platform}
                onChange={(e) => handleSocialChange(index, "platform", e.target.value)}
              />
              <input
                placeholder="URL"
                className="border p-2 flex-1"
                value={link.url}
                onChange={(e) => handleSocialChange(index, "url", e.target.value)}
              />
              <button onClick={() => handleRemoveSocial(index)} className="text-red-600"><FaTrash /></button>
            </div>
          ))}
          <button onClick={handleAddSocial} className="mt-2 text-sm bg-yellow-500 px-3 py-1 rounded text-black flex items-center gap-1">
            <FaPlus /> Add Social Link
          </button>
        </div>

        {/* Quick Links */}
        <div>
          <label className="block font-semibold mb-2">Quick Links (Page Slugs)</label>
          <input
            type="text"
            value={quickLinks.join(", ")}
            onChange={(e) => setQuickLinks(e.target.value.split(",").map((s) => s.trim()))}
            className="w-full border rounded p-2 text-sm"
            placeholder="e.g. about, contact, blog"
          />
        </div>

        {/* Sitemap */}
        <div>
          <label className="block font-semibold mb-2">Sitemap (Section Names)</label>
          <input
            type="text"
            value={sitemap.join(", ")}
            onChange={(e) => setSitemap(e.target.value.split(",").map((s) => s.trim()))}
            className="w-full border rounded p-2 text-sm"
            placeholder="e.g. Courses, Instructors, Careers"
          />
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block font-semibold mb-2">Email</label>
            <input type="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} className="w-full border rounded p-2" />
          </div>
          <div>
            <label className="block font-semibold mb-2">Phone</label>
            <input type="text" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} className="w-full border rounded p-2" />
          </div>
          <div>
            <label className="block font-semibold mb-2">Address</label>
            <input type="text" value={contact.address} onChange={(e) => setContact({ ...contact, address: e.target.value })} className="w-full border rounded p-2" />
          </div>
        </div>

        {/* WhatsApp Contact */}
        <div>
          <label className="block font-semibold mb-2">WhatsApp Number</label>
          <input
            type="text"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            className="w-full border rounded p-2"
            placeholder="e.g. 15551234567"
          />
        </div>

        {/* Newsletter Toggle */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showNewsletter}
            onChange={() => setShowNewsletter(!showNewsletter)}
          />
          <label>Show Newsletter Subscription</label>
        </div>

        {/* Footer Note */}
        <div>
          <label className="block font-semibold mb-2">Bottom Text / Legal Note</label>
          <textarea
            value={footerNote}
            onChange={(e) => setFooterNote(e.target.value)}
            rows={2}
            className="w-full border rounded p-2"
          />
        </div>

        {/* AdSense Config */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={adsEnabled}
              onChange={() => setAdsEnabled(!adsEnabled)}
            />
            <label>Enable Google AdSense</label>
          </div>
          <input
            type="text"
            value={adsClientId}
            onChange={(e) => setAdsClientId(e.target.value)}
            className="w-full border rounded p-2"
            placeholder="AdSense Client ID (e.g. ca-pub-xxxxxxxxxxxxxxxx)"
          />
        </div>

        {/* Payment Methods */}
        <div>
          <label className="block font-semibold mb-2">Accepted Payment Methods</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.keys(paymentMethods).map((method) => (
              <div key={method} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={paymentMethods[method]}
                  onChange={() => setPaymentMethods((prev) => ({ ...prev, [method]: !prev[method] }))}
                />
                <label className="capitalize">{method}</label>
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4">
          <button className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition">
            Save Settings
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}