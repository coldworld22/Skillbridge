import { useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { createCoupon } from "@/services/admin/couponService";
import { useRouter } from "next/router";

export default function NewCouponPage() {
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState(10);
  const [startsAt, setStartsAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [appliesTo, setAppliesTo] = useState("plan");
  const [appliesToId, setAppliesToId] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createCoupon({
      code,
      discount_percent: parseInt(discount, 10),
      starts_at: startsAt || undefined,
      expires_at: expiresAt || undefined,
      usage_limit: usageLimit ? parseInt(usageLimit, 10) : undefined,
      applies_to: appliesTo,
      applies_to_id: appliesToId || undefined,
    }).catch(() => {});
    router.push("/dashboard/admin/coupons");
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-lg">
        <h1 className="text-2xl font-bold mb-4">New Coupon</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="CODE" className="border p-2 w-full" required />
          <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} className="border p-2 w-full" min="1" max="100" />
          <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className="border p-2 w-full" />
          <input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="border p-2 w-full" />
          <input type="number" value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} placeholder="Usage Limit" className="border p-2 w-full" />
          <select value={appliesTo} onChange={(e) => setAppliesTo(e.target.value)} className="border p-2 w-full">
            <option value="plan">Plan</option>
            <option value="class">Class</option>
            <option value="tutorial">Tutorial</option>
          </select>
          <input value={appliesToId} onChange={(e) => setAppliesToId(e.target.value)} placeholder="Target ID" className="border p-2 w-full" />
          <button className="bg-blue-600 text-white px-4 py-2 rounded" type="submit">Save</button>
        </form>
      </div>
    </AdminLayout>
  );
}
