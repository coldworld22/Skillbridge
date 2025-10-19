import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaCheck } from "react-icons/fa";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import useAuthStore from "@/store/auth/authStore";
import { fetchPublicPlans } from "@/services/public/planService";
import { formatCurrency } from "@/utils/currency";

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

            const cardClasses = `p-6 rounded-lg shadow-2xl transition-all duration-300 ${
              isMiddle ? "md:scale-105" : ""
            } relative flex flex-col h-full`;
            const includedClasses = Array.isArray(plan.included_classes)
              ? plan.included_classes
              : [];
            const includedTutorials = Array.isArray(plan.included_tutorials)
              ? plan.included_tutorials
              : [];
            const includedBooks = Array.isArray(plan.included_books)
              ? plan.included_books
              : [];
            const monthlyLabel = formatCurrency(plan.price_monthly || 0, {
              currency: plan.currency,
            });
            const yearlyLabel = formatCurrency(plan.price_yearly || 0, {
              currency: plan.currency,
            });

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
                    ? `${monthlyLabel}/mo`
                    : `${yearlyLabel}/yr`}
                </p>

                <ul className="space-y-2 text-gray-300">
                  {plan.features?.map((feature, idx) => (
                    <li key={idx} className="flex items-center justify-center gap-2">
                      <FaCheck className="text-green-400" /> {feature.description || feature.value}
                    </li>
                  ))}
                </ul>

                {includedClasses.length > 0 && (
                  <div className="mt-6 bg-black/20 rounded-lg p-4 text-left space-y-3">
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-yellow-200">
                      {t("plan_included_classes_title", { defaultValue: "Included Classes" })}
                    </h4>
                    <ul className="space-y-3">
                      {includedClasses.slice(0, 3).map((cls) => (
                        <li key={cls.id} className="flex items-center gap-3">
                          {cls.cover_image ? (
                            <img
                              src={cls.cover_image}
                              alt={cls.title}
                              className="w-12 h-12 rounded object-cover border border-white/30"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded bg-white/10 flex items-center justify-center text-xs text-white/60">
                              {t("plan_class_placeholder", { defaultValue: "Class" })}
                            </div>
                          )}
                          <div className="flex-1">
                            <a
                              href={cls.slug ? `/online-classes/${cls.slug}` : `/online-classes/${cls.id}`}
                              className="font-semibold text-white line-clamp-1 hover:underline"
                            >
                              {cls.title}
                            </a>
                            <p className="text-xs text-gray-200/80">
                              {cls.access_type === "free"
                                ? t("plan_class_access_plan", { defaultValue: "Included with your plan" })
                                : t("plan_class_access_paid", {
                                    defaultValue: "Priced at {{price}}",
                                    price: formatCurrency(cls.price || 0, {
                                      currency: plan.currency,
                                    }),
                                  })}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                    {includedClasses.length > 3 && (
                      <p className="text-xs text-gray-200/70">
                        {t("plan_more_classes", {
                          count: includedClasses.length - 3,
                          defaultValue: "+ {{count}} more classes",
                        })}
                      </p>
                    )}
                  </div>
                )}

                {includedTutorials.length > 0 && (
                  <div className="mt-6 bg-black/20 rounded-lg p-4 text-left space-y-3">
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-yellow-200">
                      {t("plan_included_tutorials_title", { defaultValue: "Included Tutorials" })}
                    </h4>
                    <ul className="space-y-3">
                      {includedTutorials.slice(0, 3).map((tutorial) => (
                        <li key={tutorial.id} className="flex items-center gap-3">
                          {tutorial.cover_image ? (
                            <img
                              src={tutorial.cover_image}
                              alt={tutorial.title}
                              className="w-12 h-12 rounded object-cover border border-white/30"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded bg-white/10 flex items-center justify-center text-xs text-white/60">
                              {t("plan_tutorial_placeholder", { defaultValue: "Tutorial" })}
                            </div>
                          )}
                          <div className="flex-1">
                            <a
                              href={`/tutorials/${tutorial.slug || tutorial.id}`}
                              className="font-semibold text-white line-clamp-1 hover:underline"
                            >
                              {tutorial.title}
                            </a>
                            <p className="text-xs text-gray-200/80">
                              {tutorial.is_paid
                                ? t("plan_tutorial_access_paid", {
                                    defaultValue: "Normally {{price}}, free with your plan",
                                    price: formatCurrency(tutorial.price || 0, {
                                      currency: plan.currency,
                                    }),
                                  })
                                : t("plan_tutorial_access_plan", { defaultValue: "Included with your plan" })}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                    {includedTutorials.length > 3 && (
                      <p className="text-xs text-gray-200/70">
                        {t("plan_more_tutorials", {
                          defaultValue: "+ {{count}} more tutorials",
                          count: includedTutorials.length - 3,
                        })}
                      </p>
                    )}
                  </div>
                )}

                {includedBooks.length > 0 && (
                  <div className="mt-6 bg-black/20 rounded-lg p-4 text-left space-y-3">
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-yellow-200">
                      {t("plan_included_books_title", { defaultValue: "Included Books" })}
                    </h4>
                    <ul className="space-y-3">
                      {includedBooks.slice(0, 3).map((book) => (
                        <li key={book.id} className="flex items-center gap-3">
                          {book.cover_image ? (
                            <img
                              src={book.cover_image}
                              alt={book.title}
                              className="w-12 h-12 rounded object-cover border border-white/30"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded bg-white/10 flex items-center justify-center text-xs text-white/60">
                              {t("plan_book_placeholder", { defaultValue: "Book" })}
                            </div>
                          )}
                          <div className="flex-1">
                            <a
                              href={`/books/${book.id}`}
                              className="font-semibold text-white line-clamp-1 hover:underline"
                            >
                              {book.title}
                            </a>
                            <p className="text-xs text-gray-200/80">
                              {t("plan_book_access_paid", {
                                defaultValue: "Normally {{price}}, free with your plan",
                                price: formatCurrency(book.price || 0, {
                                  currency: plan.currency,
                                }),
                              })}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                    {includedBooks.length > 3 && (
                      <p className="text-xs text-gray-200/70">
                        {t("plan_more_books", {
                          defaultValue: "+ {{count}} more books",
                          count: includedBooks.length - 3,
                        })}
                      </p>
                    )}
                  </div>
                )}

                {includedTutorials.length > 0 && (
                  <div className="mt-6 bg-black/20 rounded-lg p-4 text-left space-y-3">
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-yellow-200">
                      {t("plan_included_tutorials_title")}
                    </h4>
                    <ul className="space-y-3">
                      {includedTutorials.slice(0, 3).map((tutorial) => (
                        <li key={tutorial.id} className="flex items-center gap-3">
                          {tutorial.cover_image ? (
                            <img
                              src={tutorial.cover_image}
                              alt={tutorial.title}
                              className="w-12 h-12 rounded object-cover border border-white/30"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded bg-white/10 flex items-center justify-center text-xs text-white/60">
                              {t("plan_tutorial_placeholder")}
                            </div>
                          )}
                          <div className="flex-1">
                            <a
                              href={
                                tutorial.slug
                                  ? `/tutorials/${tutorial.slug}`
                                  : `/tutorials/${tutorial.id}`
                              }
                              className="font-semibold text-white line-clamp-1 hover:underline"
                            >
                              {tutorial.title}
                            </a>
                            <p className="text-xs text-gray-200/80">
                              {Number(tutorial.price) > 0
                                ? t("plan_tutorial_access_paid", {
                                    price: formatCurrency(tutorial.price || 0, {
                                      currency: plan.currency,
                                    }),
                                  })
                                : t("plan_tutorial_access_plan")}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                    {includedTutorials.length > 3 && (
                      <p className="text-xs text-gray-200/70">
                        {t("plan_more_tutorials", {
                          count: includedTutorials.length - 3,
                        })}
                      </p>
                    )}
                  </div>
                )}

                {includedBooks.length > 0 && (
                  <div className="mt-6 bg-black/20 rounded-lg p-4 text-left space-y-3">
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-yellow-200">
                      {t("plan_included_books_title")}
                    </h4>
                    <ul className="space-y-3">
                      {includedBooks.slice(0, 3).map((book) => (
                        <li key={book.id} className="flex items-center gap-3">
                          {book.cover_image_url ? (
                            <img
                              src={book.cover_image_url}
                              alt={book.title}
                              className="w-12 h-12 rounded object-cover border border-white/30"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded bg-white/10 flex items-center justify-center text-xs text-white/60">
                              {t("plan_book_placeholder")}
                            </div>
                          )}
                          <div className="flex-1">
                            <a
                              href={`/marketplace/books/${book.id}`}
                              className="font-semibold text-white line-clamp-1 hover:underline"
                            >
                              {book.title}
                            </a>
                            <p className="text-xs text-gray-200/80">
                              {Number(book.price) > 0
                                ? t("plan_book_access_paid", {
                                    price: formatCurrency(book.price || 0, {
                                      currency: plan.currency,
                                    }),
                                  })
                                : t("plan_book_access_plan")}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                    {includedBooks.length > 3 && (
                      <p className="text-xs text-gray-200/70">
                        {t("plan_more_books", { count: includedBooks.length - 3 })}
                      </p>
                    )}
                  </div>
                )}

                {includedBooks.length > 0 && (
                  <div className="mt-6 bg-black/20 rounded-lg p-4 text-left space-y-3">
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-yellow-200">
                      {t("plan_included_books_title")}
                    </h4>
                    <ul className="space-y-3">
                      {includedBooks.slice(0, 3).map((book) => (
                        <li key={book.id} className="flex items-center gap-3">
                          {book.cover_image_url ? (
                            <img
                              src={book.cover_image_url}
                              alt={book.title}
                              className="w-12 h-12 rounded object-cover border border-white/30"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded bg-white/10 flex items-center justify-center text-xs text-white/60">
                              {t("plan_book_placeholder")}
                            </div>
                          )}
                          <div className="flex-1">
                            <a
                              href={`/marketplace/books/${book.id}`}
                              className="font-semibold text-white line-clamp-1 hover:underline"
                            >
                              {book.title}
                            </a>
                            <p className="text-xs text-gray-200/80">
                              {Number(book.price || 0) > 0
                                ? t("plan_class_access_paid", {
                                    price: formatCurrency(book.price || 0, {
                                      currency: plan.currency,
                                    }),
                                  })
                                : t("plan_class_access_plan")}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                    {includedBooks.length > 3 && (
                      <p className="text-xs text-gray-200/70">
                        {t("plan_more_books", { count: includedBooks.length - 3 })}
                      </p>
                    )}
                  </div>
                )}

                {includedTutorials.length > 0 && (
                  <div className="mt-6 bg-black/20 rounded-lg p-4 text-left space-y-3">
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-yellow-200">
                      {t("plan_included_tutorials_title")}
                    </h4>
                    <ul className="space-y-3">
                      {includedTutorials.slice(0, 3).map((tutorial) => (
                        <li key={tutorial.id} className="flex items-center gap-3">
                          {tutorial.cover_image ? (
                            <img
                              src={tutorial.cover_image}
                              alt={tutorial.title}
                              className="w-12 h-12 rounded object-cover border border-white/30"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded bg-white/10 flex items-center justify-center text-xs text-white/60">
                              {t("plan_tutorial_placeholder")}
                            </div>
                          )}
                          <div className="flex-1">
                            <a
                              href={`/tutorials/${tutorial.slug || tutorial.id}`}
                              className="font-semibold text-white line-clamp-1 hover:underline"
                            >
                              {tutorial.title}
                            </a>
                            <p className="text-xs text-gray-200/80">
                              {tutorial.is_paid
                                ? t("plan_class_access_paid", {
                                    price: formatCurrency(tutorial.price || 0, {
                                      currency: plan.currency,
                                    }),
                                  })
                                : t("plan_class_access_plan")}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                    {includedTutorials.length > 3 && (
                      <p className="text-xs text-gray-200/70">
                        {t("plan_more_tutorials", {
                          count: includedTutorials.length - 3,
                        })}
                      </p>
                    )}
                  </div>
                )}

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
