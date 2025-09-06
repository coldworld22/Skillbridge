import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaCheck } from "react-icons/fa";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import useAuthStore from "@/store/auth/authStore";
import { fetchPublicPlans } from "@/services/public/planService";

const SubscriptionPlans = ({ role = "student" }) => {
  const { t } = useTranslation("website");
  const router = useRouter();
  const [plans, setPlans] = useState([]);
  const [interval, setInterval] = useState("monthly");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchPublicPlans(role);
        setPlans(data.filter((p) => p.active));
      } catch (err) {
        console.error("Failed to load plans", err);
      }
    };
    load();
  }, [role]);

  return (

    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      viewport={{ once: true }}
    >
      <section className="py-16 bg-gray-900 text-white text-center">
        <h2 className="text-4xl font-bold mb-6 text-yellow-500">{t("subscription_heading")} 🚀</h2>
        <p className="text-lg text-gray-300 mb-10">
          {t("subscription_description")}

        </p>

        <div className="mb-8 flex justify-center gap-4">
          <button
            className={`px-4 py-2 rounded-l ${
              interval === "monthly"
                ? "bg-yellow-500 text-gray-900"
                : "bg-gray-700"
            }`}
            onClick={() => setInterval("monthly")}
          >
            {t("monthly")}
          </button>
          <button
            className={`px-4 py-2 rounded-r ${
              interval === "yearly"
                ? "bg-yellow-500 text-gray-900"
                : "bg-gray-700"
            }`}
            onClick={() => setInterval("yearly")}
          >
            {t("yearly")}
          </button>
        </div>

        {/* Subscription Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto relative z-10">
          {plans.map((plan, index) => {
            const isMiddle = index === 1;
            let styleConf = null;
            if (plan.style) {
              try {
                styleConf = JSON.parse(plan.style);
              } catch {
                styleConf = null;
              }
            }
            const styleObj = {
              backgroundColor: plan.color || "#1f2937",
              color: "#fff",
            };
            if (styleConf) {
              if (styleConf.gradientStart && styleConf.gradientEnd) {
                styleObj.background = `linear-gradient(90deg, ${styleConf.gradientStart}, ${styleConf.gradientEnd})`;
              }
              if (styleConf.textColor) styleObj.color = styleConf.textColor;
              if (styleConf.textSize) styleObj.fontSize = `${styleConf.textSize}px`;
            }
            const buttonStyles = {};
            if (styleConf) {
              if (styleConf.buttonColor) buttonStyles.backgroundColor = styleConf.buttonColor;
              if (styleConf.buttonTextColor) buttonStyles.color = styleConf.buttonTextColor;
            }

            const cardClasses = `p-6 rounded-lg shadow-2xl transition-all duration-300 ${isMiddle ? "md:scale-105" : ""} relative`;

            return (
              <motion.div
                key={plan.id}
                className={cardClasses}
                style={styleObj}
                whileHover={{ scale: 1.08 }}
              >
                {plan.recommended && (
                  <div className="absolute -top-4 right-4 bg-white text-yellow-500 font-bold px-3 py-1 rounded-full text-xs shadow-md animate-pulse z-20">
                    {t("subscription_most_popular")}
                  </div>
                )}

                <h3 className="text-2xl font-extrabold mb-2">{plan.name}</h3>
                <p className="text-3xl font-bold mb-4">
                  {interval === "monthly"
                    ? `${plan.price_monthly} ${plan.currency}/mo`
                    : `${plan.price_yearly} ${plan.currency}/yr`}
                </p>

                <ul className="space-y-2 text-gray-300">
                  {plan.features?.map((feature, idx) => (
                    <li key={idx} className="flex items-center justify-center gap-2">
                      <FaCheck className="text-green-400" /> {feature.description || feature.value}
                    </li>
                  ))}
                </ul>

                <button
                  className="mt-6 px-6 py-3 rounded-lg font-semibold hover:opacity-90"
                  style={buttonStyles}
                  onClick={() => {
                    const checkoutUrl = `/payments/checkout?itemType=plan&itemId=${plan.id}&interval=${interval}`;
                    if (useAuthStore.getState().isAuthenticated()) {
                      router.push(checkoutUrl);
                    } else {
                      toast.info(t("please_login_to_purchase"));
                      router.push(
                        `/auth/login?redirect=${encodeURIComponent(checkoutUrl)}`
                      );
                    }
                  }}
                >
                  {t("subscription_select_plan")}
                </button>
              </motion.div>
            );
          })}
        </div>
      </section>
    </motion.section>



  );
};

export default SubscriptionPlans;
