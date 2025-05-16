// components/shared/PlanLimitHint.jsx
import plansConfig from "@/config/plansConfig";

export default function PlanLimitHint({ plan }) {
  const config = plansConfig[plan];
  if (!config) return null;

  return (
    <div className="mt-2 text-sm text-gray-500 bg-gray-50 border rounded p-3">
      <p><strong>Plan:</strong> {plan.charAt(0).toUpperCase() + plan.slice(1)}</p>
      <ul className="list-disc pl-5">
        <li>Max ad duration: {config.maxAdDuration} days</li>
        <li>Max active ads: {config.maxAds}</li>
        <li>Available placements: {config.placements.join(", ")}</li>
      </ul>
    </div>
  );
}