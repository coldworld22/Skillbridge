import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FaCheck } from "react-icons/fa";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import useAuthStore from "@/store/auth/authStore";
import { fetchPublicPlans } from "@/services/public/planService";
import { formatCurrency } from "@/utils/currency";

const parseStyleConfig = (plan = {}) => {
  let styleConfig = {};
  if (plan.style) {
    try {
      styleConfig = JSON.parse(plan.style);
    } catch (_) {
      styleConfig = {};
    }
  }

  const cardStyle = {
    backgroundColor: plan.color || "#1f2937",
    color: "#ffffff",
  };

  if (styleConfig.gradientStart && styleConfig.gradientEnd) {
    cardStyle.background = `linear-gradient(90deg, ${styleConfig.gradientStart}, ${styleConfig.gradientEnd})`;
  }
  if (styleConfig.textColor) {
    cardStyle.color = styleConfig.textColor;
  }
  if (styleConfig.textSize) {
    cardStyle.fontSize = `${styleConfig.textSize}px`;
  }

  const buttonStyles = {};
  if (styleConfig.buttonColor) {
    buttonStyles.backgroundColor = styleConfig.buttonColor;
  }
  if (styleConfig.buttonTextColor) {
    buttonStyles.color = styleConfig.buttonTextColor;
  }

  return { cardStyle, buttonStyles };
};

const normalizeFeature = (feature, idx) => {
  if (!feature) return null;
  const id = feature.id || `${feature.feature_key || "feature"}-${idx}`;
  const label =
    typeof feature.label === "string" ? feature.label.trim() : "";
  const description =
    typeof feature.description === "string"
      ? feature.description.trim()
      : "";
  const valueText =
    feature.value !== undefined && feature.value !== null
      ? String(feature.value).trim()
      : "";

  const detail =
    description && (!label || description.toLowerCase() !== label.toLowerCase())
      ? description
      : !label && valueText
        ? valueText
        : "";

  if (!label && !detail) return null;
  return { id, label, detail };
};

const buildFeatureSections = (plan) => {
  const fromSections = Array.isArray(plan.feature_sections)
    ? plan.feature_sections
    : [];
  if (fromSections.length) {
    return fromSections
      .map((section, sectionIdx) => {
        const features = Array.isArray(section.features)
          ? section.features
          : [];
        const items = features
          .map((feature, idx) => normalizeFeature(feature, idx))
          .filter(Boolean);
        if (!items.length) return null;
        return {
          key: section.module || `section-${sectionIdx}`,
          label:
            typeof section.module_label === "string"
              ? section.module_label.trim()
              : "",
          features: items,
        };
      })
      .filter(Boolean);
  }

  const features = Array.isArray(plan.features) ? plan.features : [];
  const normalized = features
    .map((feature, idx) => normalizeFeature(feature, idx))
    .filter(Boolean);
  if (!normalized.length) return [];
  return [
    {
      key: "default",
      label: "",
      features: normalized,
    },
  ];
};

const IncludedSection = ({
  items,
  title,
  placeholder,
  linkBuilder,
  subtitleBuilder,
  moreLabel,
}) => {
  if (!Array.isArray(items) || !items.length) return null;
  const visible = items.slice(0, 3);
  return (
    <div className="mt-6 bg-black/20 rounded-lg p-4 text-left space-y-3">
      <h4 className="text-sm font-semibold uppercase tracking-wide text-yellow-200">
        {title}
      </h4>
      <ul className="space-y-3">
        {visible.map((item) => (
          <li key={item.id || item.slug} className="flex items-center gap-3">
            {item.cover_image || item.cover_image_url ? (
              <img
                src={item.cover_image || item.cover_image_url}
                alt={item.title}
                className="w-12 h-12 rounded object-cover border border-white/30"
                loading="lazy"
              />
            ) : (
              <div className="w-12 h-12 rounded bg-white/10 flex items-center justify-center text-xs text-white/60">
                {placeholder}
              </div>
            )}
            <div className="flex-1">
              <a
                href={linkBuilder(item)}
                className="font-semibold text-white line-clamp-1 hover:underline"
              >
                {item.title}
              </a>
              <p className="text-xs text-gray-200/80">{subtitleBuilder(item)}</p>
            </div>
          </li>
        ))}
      </ul>
      {items.length > 3 && (
        <p className="text-xs text-gray-200/70">{moreLabel(items.length - 3)}</p>
      )}
    </div>
  );
};

const PlanCard = ({ plan, index, interval, onSelect, t, user, viewRole }) => {
  const { cardStyle, buttonStyles } = parseStyleConfig(plan);
  const sections = buildFeatureSections(plan);

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

  const emphasized = plan.recommended || index === 1;
  const planRole = (plan.target_role || viewRole || "").toLowerCase();
  const showIncludedContent = planRole === "instructor";

  const selectLabel =
    user?.plan_id === plan.id
      ? t("subscription_current_plan", { defaultValue: "Current Plan" })
      : t("subscription_select_plan", { defaultValue: "Select Plan" });

  return (
    <motion.div
      key={plan.id}
      className={`p-6 rounded-lg shadow-2xl transition-all duration-300 relative flex flex-col h-full ${
        emphasized ? "md:scale-105" : ""
      }`}
      style={cardStyle}
      whileHover={{ scale: 1.05 }}
    >
      {plan.recommended && (
        <div className="absolute -top-4 right-4 bg-white text-yellow-500 font-bold px-3 py-1 rounded-full text-xs shadow-md z-20">
          {t("subscription_most_popular", { defaultValue: "Most Popular" })}
        </div>
      )}

      <h3 className="text-2xl font-extrabold mb-2">{plan.name}</h3>
      <p className="text-3xl font-bold mb-4">
        {interval === "monthly" ? `${monthlyLabel}/mo` : `${yearlyLabel}/yr`}
      </p>

      {sections.length > 0 && (
        <div className="space-y-4 text-gray-200">
          {sections.map((section) => (
            <div key={section.key} className="space-y-2">
              {section.label && (
                <p className="text-xs uppercase tracking-wide text-yellow-300">
                  {section.label}
                </p>
              )}
              <ul className="space-y-2">
                {section.features.map((feature) => (
                  <li
                    key={feature.id}
                    className="flex items-start gap-2 text-left"
                  >
                    <FaCheck className="mt-1 text-green-400" />
                    <div className="space-y-1">
                      {feature.label && (
                        <p className="text-sm font-semibold text-white">
                          {feature.label}
                        </p>
                      )}
                      {feature.detail && (
                        <p className="text-xs text-gray-200/80 leading-relaxed">
                          {feature.detail}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {showIncludedContent && (
        <>
          <IncludedSection
            items={includedClasses}
            title={t("plan_included_classes_title", {
              defaultValue: "Included Classes",
            })}
            placeholder={t("plan_class_placeholder", { defaultValue: "Class" })}
            linkBuilder={(cls) =>
              cls.slug
                ? `/online-classes/${cls.slug}`
                : `/online-classes/${cls.id}`
            }
            subtitleBuilder={(cls) =>
              cls.access_type === "free"
                ? t("plan_class_access_plan", {
                    defaultValue: "Included with your plan",
                  })
                : t("plan_class_access_paid", {
                    defaultValue: "Priced at {{price}}",
                    price: formatCurrency(cls.price || 0, {
                      currency: plan.currency,
                    }),
                  })
            }
            moreLabel={(count) =>
              t("plan_more_classes", {
                count,
                defaultValue: "+ {{count}} more classes",
              })
            }
          />

          <IncludedSection
            items={includedTutorials}
            title={t("plan_included_tutorials_title", {
              defaultValue: "Included Tutorials",
            })}
            placeholder={t("plan_tutorial_placeholder", {
              defaultValue: "Tutorial",
            })}
            linkBuilder={(tutorial) =>
              tutorial.slug
                ? `/tutorials/${tutorial.slug}`
                : `/tutorials/${tutorial.id}`
            }
            subtitleBuilder={(tutorial) =>
              Number(tutorial.price) > 0
                ? t("plan_tutorial_access_paid", {
                    defaultValue: "Normally {{price}}, free with your plan",
                    price: formatCurrency(tutorial.price || 0, {
                      currency: plan.currency,
                    }),
                  })
                : t("plan_tutorial_access_plan", {
                    defaultValue: "Included with your plan",
                  })
            }
            moreLabel={(count) =>
              t("plan_more_tutorials", {
                count,
                defaultValue: "+ {{count}} more tutorials",
              })
            }
          />

          <IncludedSection
            items={includedBooks}
            title={t("plan_included_books_title", {
              defaultValue: "Included Books",
            })}
            placeholder={t("plan_book_placeholder", { defaultValue: "Book" })}
            linkBuilder={(book) => `/books/${book.id}`}
            subtitleBuilder={(book) =>
              Number(book.price) > 0
                ? t("plan_book_access_paid", {
                    defaultValue: "Normally {{price}}, free with your plan",
                    price: formatCurrency(book.price || 0, {
                      currency: plan.currency,
                    }),
                  })
                : t("plan_book_access_plan", {
                    defaultValue: "Included with your plan",
                  })
            }
            moreLabel={(count) =>
              t("plan_more_books", {
                count,
                defaultValue: "+ {{count}} more books",
              })
            }
          />
        </>
      )}

      <button
        className="mt-6 px-6 py-3 rounded-lg font-semibold hover:opacity-90"
        style={buttonStyles}
        onClick={() => onSelect(plan.id)}
      >
        {selectLabel}
      </button>
    </motion.div>
  );
};

const SubscriptionPlans = ({ role = "student" }) => {
  const { t } = useTranslation("website");
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [plans, setPlans] = useState([]);
  const [interval, setInterval] = useState("monthly");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    const loadPlans = async () => {
      try {
        const data = await fetchPublicPlans(role === "all" ? undefined : role);
        if (!isMounted) return;
        const activePlans = Array.isArray(data)
          ? data.filter((plan) => plan.active)
          : [];
        setPlans(activePlans);
      } catch (err) {
        if (isMounted) {
          console.error("Failed to load plans", err);
          toast.error(
            t("subscription_load_error", {
              defaultValue: "Unable to load subscription plans.",
            })
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadPlans();
    return () => {
      isMounted = false;
    };
  }, [role, t]);

  const planGroups = useMemo(() => {
    if (role === "all") {
      const student = plans.filter(
        (plan) => (plan.target_role || "").toLowerCase() === "student"
      );
      const instructor = plans.filter(
        (plan) => (plan.target_role || "").toLowerCase() === "instructor"
      );
      return [
        {
          key: "student",
          title: t("subscription_student_heading", {
            defaultValue: "Student Plans",
          }),
          plans: student,
        },
        {
          key: "instructor",
          title: t("subscription_instructor_heading", {
            defaultValue: "Instructor Plans",
          }),
          plans: instructor,
        },
      ].filter((group) => group.plans.length);
    }

    return [
      {
        key: role,
        title:
          role === "instructor"
            ? t("subscription_instructor_heading", {
                defaultValue: "Instructor Plans",
              })
            : t("subscription_student_heading", {
                defaultValue: "Student Plans",
              }),
        plans,
      },
    ].filter((group) => group.plans.length);
  }, [plans, role, t]);

  const handleSelectPlan = (planId) => {
    const checkoutUrl = `/payments/checkout?itemType=plan&itemId=${planId}&interval=${interval}`;
    if (useAuthStore.getState().isAuthenticated()) {
      router.push(checkoutUrl);
    } else {
      toast.info(
        t("please_login_to_purchase", {
          defaultValue: "Please log in to continue.",
        })
      );
      router.push(`/auth/login?redirect=${encodeURIComponent(checkoutUrl)}`);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      viewport={{ once: true }}
    >
      <section className="py-16 bg-gray-900 text-white text-center">
        <h2 className="text-4xl font-bold mb-6 text-yellow-500">
          {t("subscription_heading", { defaultValue: "Unlock Your Potential" })}{" "}
          🚀
        </h2>
        <p className="text-lg text-gray-300 mb-10">
          {t("subscription_description", {
            defaultValue:
              "Choose the plan that fits your goals. Upgrade any time.",
          })}
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
            {t("monthly", { defaultValue: "Monthly" })}
          </button>
          <button
            className={`px-4 py-2 rounded-r ${
              interval === "yearly"
                ? "bg-yellow-500 text-gray-900"
                : "bg-gray-700"
            }`}
            onClick={() => setInterval("yearly")}
          >
            {t("yearly", { defaultValue: "Yearly" })}
          </button>
        </div>

        {loading ? (
          <p className="text-gray-400">
            {t("subscription_loading", { defaultValue: "Loading plans..." })}
          </p>
        ) : planGroups.length === 0 ? (
          <p className="text-gray-400">
            {t("subscription_no_plans", {
              defaultValue: "No subscription plans are currently available.",
            })}
          </p>
        ) : (
          planGroups.map((group) => (
            <div key={group.key} className="mb-10">
              {role === "all" && (
                <h3 className="text-2xl font-semibold text-yellow-400 mb-6">
                  {group.title}
                </h3>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto relative z-10">
                {group.plans.map((plan, index) => {
                  const inferredRole =
                    (plan.target_role || group.key || role || "").toLowerCase();
                  return (
                    <PlanCard
                      key={plan.id}
                      plan={plan}
                      index={index}
                      interval={interval}
                      onSelect={handleSelectPlan}
                      t={t}
                      user={user}
                      viewRole={inferredRole}
                    />
                  );
                })}
              </div>
            </div>
          ))
        )}
      </section>
    </motion.section>
  );
};

export default SubscriptionPlans;
