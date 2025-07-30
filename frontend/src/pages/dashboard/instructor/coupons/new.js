import { useState } from "react";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import { createCoupon } from "@/services/instructor/couponService";
import { useRouter } from "next/router";

export default function InstructorCouponNew() {
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState(10);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createCoupon({ code, discount_percent: parseInt(discount, 10) }).catch(() => {});
    router.push("/dashboard/instructor/coupons");
  };

  return (
    <InstructorLayout>
      <div className="p-6 max-w-lg">
        <h1 className="text-2xl font-bold mb-4">New Coupon</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="CODE" className="border p-2 w-full" required />
          <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} className="border p-2 w-full" min="1" max="100" />
          <button className="bg-blue-600 text-white px-4 py-2 rounded" type="submit">Save</button>
        </form>
      </div>
    </InstructorLayout>
  );
}
