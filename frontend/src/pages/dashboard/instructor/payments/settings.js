import InstructorLayout from "@/components/layouts/InstructorLayout";
import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../next-i18next.config.js";

export default function InstructorPaymentSettingsPage() {
  const { t } = useTranslation(["instructor-payments", "dashboard"]);
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

  const methodLabels = useMemo(
    () => ({
      PayPal: t("instructor-payments:settings.methods.paypal"),
      "Bank Transfer": t("instructor-payments:settings.methods.bank_transfer"),
      Stripe: t("instructor-payments:settings.methods.stripe"),
      Moyasar: t("instructor-payments:settings.methods.moyasar"),
      "NFT Wallet": t("instructor-payments:settings.methods.nft_wallet"),
    }),
    [t]
  );

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

    const detailsMap = {
      PayPal: t("instructor-payments:settings.alert.paypal", {
        email: paypalEmail,
      }),
      "Bank Transfer": t("instructor-payments:settings.alert.bank_transfer", {
        iban: bankDetails.iban,
        swift: bankDetails.swift,
      }),
      Stripe: t("instructor-payments:settings.alert.stripe", {
        id: stripeAccountId,
      }),
      Moyasar: t("instructor-payments:settings.alert.moyasar", {
        id: moyasarId,
      }),
      "NFT Wallet": t("instructor-payments:settings.alert.nft_wallet", {
        address: walletAddress,
      }),
    };

    const details =
      detailsMap[method] || t("instructor-payments:settings.alert.none");

    alert(
      t("instructor-payments:settings.alert.base", {
        method: methodLabels[method] || method,
        details,
      })
    );
  };

  return (
    <InstructorLayout>
      <div className="p-6 max-w-2xl mx-auto text-gray-800">
        <h1 className="text-2xl font-bold mb-6">
          {t("instructor-payments:settings.title")}
        </h1>

        <div className="space-y-6 bg-white p-6 rounded-xl shadow">
          <div>
            <label className="block mb-1 font-medium">
              {t("instructor-payments:settings.preferred_method")}
            </label>
            <select
              className="w-full border px-3 py-2 rounded"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              <option value="PayPal">
                {t("instructor-payments:settings.methods.paypal")}
              </option>
              <option value="Bank Transfer">
                {t("instructor-payments:settings.methods.bank_transfer")}
              </option>
              <option value="Stripe">
                {t("instructor-payments:settings.methods.stripe")}
              </option>
              <option value="Moyasar">
                {t("instructor-payments:settings.methods.moyasar")}
              </option>
              <option value="NFT Wallet">
                {t("instructor-payments:settings.methods.nft_wallet")}
              </option>
            </select>
          </div>

          {method === "PayPal" && (
            <div>
              <label className="block mb-1 font-medium">
                {t("instructor-payments:settings.fields.paypal_email")}
              </label>
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
                <label className="block mb-1 font-medium">
                  {t("instructor-payments:settings.fields.iban")}
                </label>
                <input
                  type="text"
                  name="iban"
                  className="w-full border px-3 py-2 rounded"
                  value={bankDetails.iban}
                  onChange={handleBankChange}
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">
                  {t("instructor-payments:settings.fields.swift")}
                </label>
                <input
                  type="text"
                  name="swift"
                  className="w-full border px-3 py-2 rounded"
                  value={bankDetails.swift}
                  onChange={handleBankChange}
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">
                  {t("instructor-payments:settings.fields.bank_name")}
                </label>
                <input
                  type="text"
                  name="bankName"
                  className="w-full border px-3 py-2 rounded"
                  value={bankDetails.bankName}
                  onChange={handleBankChange}
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">
                  {t("instructor-payments:settings.fields.account_holder")}
                </label>
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
              <label className="block mb-1 font-medium">
                {t("instructor-payments:settings.fields.stripe_account_id")}
              </label>
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
              <label className="block mb-1 font-medium">
                {t("instructor-payments:settings.fields.moyasar_merchant_id")}
              </label>
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
              <label className="block mb-1 font-medium">
                {t("instructor-payments:settings.fields.wallet_address")}
              </label>
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
            {t("instructor-payments:common.buttons.save_settings")}
          </button>
        </div>
      </div>
    </InstructorLayout>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(
        locale,
        ["dashboard", "instructor-payments"],
        nextI18NextConfig
      )),
    },
  };
}
