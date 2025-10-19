import { Fragment, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaInfinity,
  FaQuestionCircle,
} from "react-icons/fa";
import { PLAN_FEATURE_CATEGORIES } from "@/constants/planFeatures";
import { fetchPublicPlans } from "@/services/public/planService";

const parseRawValue = (value) => {
  if (value === null || value === undefined) return value;
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value !== "string") return value;

  const trimmed = value.trim();
  if (!trimmed.length) return "";

  try {
    return JSON.parse(trimmed);
  } catch (_) {
    const lower = trimmed.toLowerCase();
    if (lower === "true") return true;
    if (lower === "false") return false;
    const numeric = Number(trimmed);
    if (!Number.isNaN(numeric)) return numeric;
    return trimmed;
  }
};

const getFeatureEntry = (plan, key) => {
  if (!plan) return null;
  if (plan.feature_map && plan.feature_map[key]) {
    return plan.feature_map[key];
  }
  if (Array.isArray(plan.features)) {
    const raw = plan.features.find((feat) => feat.feature_key === key);
    if (!raw) return null;
    return {
      value: parseRawValue(raw.value),
      raw: raw.value,
      description: raw.description || null,
    };
  }
  return null;
};

const formatPercentage = (value) => {
  if (value === null || value === undefined) return "—";
  if (typeof value !== "number") {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return value;
    value = parsed;
  }
  const percent = value <= 1 ? value * 100 : value;
  if (Number.isNaN(percent)) return "—";
  return `${Math.round(percent)}%`;
};

const FeatureCell = ({ feature, plan }) => {
  const entry = feature.source === "plan"
    ? { value: plan?.[feature.key] }
    : getFeatureEntry(plan, feature.key);
  const value = entry?.value;

  switch (feature.type) {
    case "boolean":
      if (value === true) {
        return (
          <span className="flex items-center gap-2 text-emerald-300 font-semibold">
            <FaCheckCircle aria-hidden /> Included
          </span>
        );
      }
      if (value === false) {
        return (
          <span className="flex items-center gap-2 text-rose-300 font-semibold">
            <FaTimesCircle aria-hidden /> Not included
          </span>
        );
      }
      return (
        <span className="flex items-center gap-2 text-slate-300">
          <FaQuestionCircle aria-hidden /> Contact sales
        </span>
      );
    case "number":
      if (value === null || value === undefined || value === "") return <span className="text-slate-300">—</span>;
      return (
        <span className="text-white font-semibold">
          {value}
          {feature.suffix ? ` ${feature.suffix}` : ""}
        </span>
      );
    case "limit":
      if (value === null || value === undefined || value === "") return <span className="text-slate-300">—</span>;
      if (
        (typeof value === "string" && value.toLowerCase() === "unlimited") ||
        value === Infinity
      ) {
        return (
          <span className="flex items-center gap-2 text-amber-300 font-semibold">
            <FaInfinity aria-hidden /> {feature.unlimitedLabel || "Unlimited"}
          </span>
        );
      }
      return (
        <span className="text-white font-semibold">
          {value}
          {feature.suffix ? ` ${feature.suffix}` : ""}
        </span>
      );
    case "percentage":
      return (
        <span className="text-white font-semibold">{formatPercentage(value)}</span>
      );
    default:
      if (value === null || value === undefined) return <span className="text-slate-300">—</span>;
      return <span className="text-white font-semibold">{value}</span>;
  }
};

const PlanFeatureMatrix = ({ role = "student" }) => {
  const [plans, setPlans] = useState([]);
  const categories = PLAN_FEATURE_CATEGORIES[role] || [];

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchPublicPlans(role);
        if (mounted) {
          setPlans(data.filter((plan) => plan.active !== false));
        }
      } catch (err) {
        console.error("Failed to load plan feature matrix", err);
        if (mounted) setPlans([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [role]);

  const orderedPlans = useMemo(() => {
    return [...plans].sort((a, b) => {
      const left = a.price_monthly ?? 0;
      const right = b.price_monthly ?? 0;
      return left - right;
    });
  }, [plans]);

  if (!categories.length || !orderedPlans.length) return null;

  return (
    <section className="bg-slate-950 text-white py-16">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-3xl md:text-4xl font-extrabold">
            Compare every plan feature
          </h2>
          <p className="mt-4 text-slate-300 max-w-3xl mx-auto">
            Explore how each SkillBridge plan unlocks advertising, community, and
            learning tools tailored for {role === "instructor" ? "instructors" : "students"}.
          </p>
        </motion.div>

        <div className="overflow-x-auto mt-12 rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
          <table className="min-w-[640px] w-full">
            <thead className="bg-white/10">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold uppercase tracking-widest text-slate-200">
                  Feature
                </th>
                {orderedPlans.map((plan) => (
                  <th
                    key={plan.id}
                    className="px-6 py-4 text-sm font-semibold uppercase tracking-widest text-slate-200"
                  >
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => {
                const Icon = category.icon || FaQuestionCircle;
                return (
                  <Fragment key={category.key}>
                    <tr className="border-t border-white/10">
                      <td colSpan={1 + orderedPlans.length} className="px-6 py-6 bg-white/5">
                        <div className="flex items-center gap-3 text-left">
                          <span className="p-3 rounded-full bg-white/10 text-amber-300">
                            <Icon aria-hidden />
                          </span>
                          <div>
                            <h3 className="text-lg font-semibold">{category.label}</h3>
                            {category.description && (
                              <p className="text-sm text-slate-300 mt-1">
                                {category.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                    {category.features.map((feature) => (
                      <tr key={`${category.key}-${feature.key}`} className="border-t border-white/10">
                        <td className="px-6 py-4 align-top">
                          <div className="text-left">
                            <p className="font-semibold text-white">{feature.label}</p>
                            {feature.description && (
                              <p className="text-sm text-slate-300 mt-1 max-w-md">
                                {feature.description}
                              </p>
                            )}
                          </div>
                        </td>
                        {orderedPlans.map((plan) => (
                          <td key={`${plan.id}-${feature.key}`} className="px-6 py-4 text-center">
                            <FeatureCell feature={feature} plan={plan} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default PlanFeatureMatrix;
