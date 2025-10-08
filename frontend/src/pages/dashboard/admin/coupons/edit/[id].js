import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import AdminLayout from "@/components/layouts/AdminLayout";
import { fetchCouponById, updateCoupon } from "@/services/admin/couponService";

export default function EditCouponPage() {
  const router = useRouter();
  const { id } = router.query;
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState(10);
  const [startsAt, setStartsAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [appliesTo, setAppliesTo] = useState("plan");
  const [appliesToId, setAppliesToId] = useState("");

  useEffect(() => {
    if (id) {
      fetchCouponById(id).then((c) => {
        if (c) {
          setCode(c.code);
          setDiscount(c.discount_percent);
          setStartsAt(c.starts_at ? c.starts_at.replace('Z', '') : "");
          setExpiresAt(c.expires_at ? c.expires_at.replace('Z', '') : "");
          setUsageLimit(c.usage_limit || "");
          setAppliesTo(c.applies_to || "plan");
          setAppliesToId(c.applies_to_id || "");
        }
      });
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateCoupon(id, {
        code,
        discount_percent: parseInt(discount, 10),
        starts_at: startsAt || undefined,
        expires_at: expiresAt || undefined,
        usage_limit: usageLimit ? parseInt(usageLimit, 10) : undefined,
        applies_to: appliesTo,
        applies_to_id: appliesToId || undefined,
      });
      toast.success("Coupon updated successfully");
      router.push("/dashboard/admin/coupons");
    } catch (err) {
      toast.error("Failed to update coupon");
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-lg">
        <h1 className="text-2xl font-bold mb-4">Edit Coupon</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input value={code} onChange={(e) => setCode(e.target.value)} className="border p-2 w-full" required />
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
