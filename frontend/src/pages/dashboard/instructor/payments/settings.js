import InstructorLayout from "@/components/layouts/InstructorLayout";
import { useState, useEffect } from "react";

export default function InstructorPaymentSettingsPage() {
  const [method, setMethod] = useState("PayPal");
  const [paypalEmail, setPaypalEmail] = useState("instructor@example.com");
  const [bankDetails, setBankDetails] = useState({
    iban: "SA1234567890123456789012",
    swift: "SABBSARI",
    bankName: "SABB Bank",
    accountHolder: "Ayman Osman",
  });
  const [stripeAccountId, setStripeAccountId] = useState("sk_test_123456");
  const [moyasarId, setMoyasarId] = useState("moyasar_merchant_id");
  const [walletAddress, setWalletAddress] = useState("0xABC123...");

  // Persist settings to localStorage for use in withdrawal form
  useEffect(() => {
    const saved = localStorage.getItem("paymentSettings");
    if (saved) {
      const data = JSON.parse(saved);
      setMethod(data.method);
      setPaypalEmail(data.paypalEmail);
      setBankDetails(data.bankDetails);
      setStripeAccountId(data.stripeAccountId);
      setMoyasarId(data.moyasarId);
      setWalletAddress(data.walletAddress);
    }
  }, []);

  const handleBankChange = (e) => {
    const { name, value } = e.target;
    setBankDetails({ ...bankDetails, [name]: value });
  };

  const handleSave = () => {
    const settings = {
      method,
      paypalEmail,
      bankDetails,
      stripeAccountId,
      moyasarId,
      walletAddress,
    };
    localStorage.setItem("paymentSettings", JSON.stringify(settings));

    let message = `Saved settings for ${method}\n`;
    switch (method) {
      case "PayPal":
        message += `Email: ${paypalEmail}`;
        break;
      case "Bank Transfer":
        message += `IBAN: ${bankDetails.iban}\nSWIFT: ${bankDetails.swift}`;
        break;
      case "Stripe":
        message += `Stripe Account ID: ${stripeAccountId}`;
        break;
      case "Moyasar":
        message += `Merchant ID: ${moyasarId}`;
        break;
      case "NFT Wallet":
        message += `Wallet Address: ${walletAddress}`;
        break;
      default:
        message += "(No details configured)";
    }
    alert(message);
  };

  return (
    <InstructorLayout>
      <div className="p-6 max-w-2xl mx-auto text-gray-800">
        <h1 className="text-2xl font-bold mb-6">⚙️ Payment Settings</h1>

        <div className="space-y-6 bg-white p-6 rounded-xl shadow">
          <div>
            <label className="block mb-1 font-medium">Preferred Method</label>
            <select
              className="w-full border px-3 py-2 rounded"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              <option value="PayPal">PayPal</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Stripe">Stripe</option>
              <option value="Moyasar">Moyasar</option>
              <option value="NFT Wallet">NFT Wallet</option>
            </select>
          </div>

          {method === "PayPal" && (
            <div>
              <label className="block mb-1 font-medium">PayPal Email</label>
              <input
                type="email"
                className="w-full border px-3 py-2 rounded"
                value={paypalEmail}
                onChange={(e) => setPaypalEmail(e.target.value)}
              />
            </div>
          )}

          {method === "Bank Transfer" && (
            <>
              <div>
                <label className="block mb-1 font-medium">IBAN</label>
                <input
                  type="text"
                  name="iban"
                  className="w-full border px-3 py-2 rounded"
                  value={bankDetails.iban}
                  onChange={handleBankChange}
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">SWIFT/BIC</label>
                <input
                  type="text"
                  name="swift"
                  className="w-full border px-3 py-2 rounded"
                  value={bankDetails.swift}
                  onChange={handleBankChange}
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Bank Name</label>
                <input
                  type="text"
                  name="bankName"
                  className="w-full border px-3 py-2 rounded"
                  value={bankDetails.bankName}
                  onChange={handleBankChange}
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Account Holder</label>
                <input
                  type="text"
                  name="accountHolder"
                  className="w-full border px-3 py-2 rounded"
                  value={bankDetails.accountHolder}
                  onChange={handleBankChange}
                />
              </div>
            </>
          )}

          {method === "Stripe" && (
            <div>
              <label className="block mb-1 font-medium">Stripe Account ID</label>
              <input
                type="text"
                className="w-full border px-3 py-2 rounded"
                value={stripeAccountId}
                onChange={(e) => setStripeAccountId(e.target.value)}
              />
            </div>
          )}

          {method === "Moyasar" && (
            <div>
              <label className="block mb-1 font-medium">Moyasar Merchant ID</label>
              <input
                type="text"
                className="w-full border px-3 py-2 rounded"
                value={moyasarId}
                onChange={(e) => setMoyasarId(e.target.value)}
              />
            </div>
          )}

          {method === "NFT Wallet" && (
            <div>
              <label className="block mb-1 font-medium">Ethereum Wallet Address</label>
              <input
                type="text"
                className="w-full border px-3 py-2 rounded"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
              />
            </div>
          )}

          <button
            onClick={handleSave}
            className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-2 rounded font-medium"
          >
            Save Settings
          </button>
        </div>
      </div>
    </InstructorLayout>
  );
}
