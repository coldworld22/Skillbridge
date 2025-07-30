import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/layouts/AdminLayout";
import { fetchCouponById, updateCoupon } from "@/services/admin/couponService";

export default function EditCouponPage() {
  const router = useRouter();
  const { id } = router.query;
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState(10);

  useEffect(() => {
    if (id) {
      fetchCouponById(id).then((c) => {
        if (c) {
          setCode(c.code);
          setDiscount(c.discount_percent);
        }
      });
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await updateCoupon(id, { code, discount_percent: parseInt(discount, 10) }).catch(() => {});
    router.push("/dashboard/admin/coupons");
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-lg">
        <h1 className="text-2xl font-bold mb-4">Edit Coupon</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input value={code} onChange={(e) => setCode(e.target.value)} className="border p-2 w-full" required />
          <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} className="border p-2 w-full" min="1" max="100" />
          <button className="bg-blue-600 text-white px-4 py-2 rounded" type="submit">Save</button>
        </form>
      </div>
    </AdminLayout>
  );
}
