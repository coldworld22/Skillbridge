import { useEffect, useState } from "react";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import AdminLayout from "@/components/layouts/AdminLayout";
import { fetchAds, purchaseAd } from "@/services/admin/adService";
import plansConfig from "@/config/plansConfig";
import { toast } from "react-toastify";
import nextI18NextConfig from "../../../../../next-i18next.config.js";
import useAuthStore from "@/store/auth/authStore";

export default function PurchaseAdsPage() {
  const { t } = useTranslation("dashboard", { keyPrefix: "adsPurchasePage" });
  const [ads, setAds] = useState([]);
  const user = useAuthStore((s) => s.user);
  const planKey = user?.plan || 'basic';

  useEffect(() => {
    fetchAds().then(setAds).catch(() => setAds([]));
  }, []);

  const handlePurchase = async (id) => {
    const config = plansConfig[planKey] || {};
    const purchased = ads.filter((a) => a.purchasedAt).length;
    if (config.maxAds && purchased >= config.maxAds) {
      toast.error(t('max_ads_reached', 'Ad limit reached'));
      return;
    }
    if (config.adCredits !== undefined && purchased >= config.adCredits) {
      toast.error(t('no_ad_credits', 'No ad credits available'));
      return;
    }
    try {
      await purchaseAd(id);
      toast.success(t("purchased"));
      setAds((prev) =>
        prev.map((ad) =>
          ad.id === id ? { ...ad, purchasedAt: new Date().toISOString() } : ad
        )
      );
    } catch (err) {
      const message = err?.response?.data?.message || t("purchase_failed");
      toast.error(message);
    }
  };

  const availableAds = ads.filter((ad) => !ad.purchasedAt);

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">{t("title")}</h1>
        {availableAds.length === 0 ? (
          <p className="text-gray-500">{t("none_available")}</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availableAds.map((ad) => (
              <div key={ad.id} className="border p-4 rounded">
                <h2 className="font-semibold mb-2">{ad.title}</h2>
                {ad.image && (
                  <img
                    src={ad.image}
                    alt={ad.title}
                    className="w-full h-40 object-cover mb-2"
                  />
                )}
                <p className="mb-2">{ad.description}</p>
                <p className="mb-2">
                  {t("price")}: ${ad.price}
                </p>
                <button
                  onClick={() => handlePurchase(ad.id)}
                  className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
                >
                  {t("purchase")}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["dashboard"], nextI18NextConfig)),
    },
  };
}
