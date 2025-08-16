import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import { fetchCoupons, deleteCoupon } from "@/services/instructor/couponService";
import Link from "next/link";

export default function InstructorCouponsPage() {
  const [coupons, setCoupons] = useState([]);

  useEffect(() => {
    fetchCoupons()
      .then(setCoupons)
      .catch(() => {
        setCoupons([]);
        toast.error("Failed to load coupons");
      });
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Delete this coupon?")) return;
    try {
      await deleteCoupon(id);
      setCoupons((prev) => prev.filter((c) => c.id !== id));
      toast.success("Coupon deleted successfully");
    } catch (err) {
      toast.error("Failed to delete coupon");
    }
  };

  return (
    <InstructorLayout>
      <div className="p-6">
        <header className="flex justify-between mb-6">
          <h1 className="text-2xl font-bold">My Coupons</h1>
          <Link href="/dashboard/instructor/coupons/new" className="bg-green-600 px-4 py-2 text-white rounded">New Coupon</Link>
        </header>
        <table className="min-w-full bg-white text-sm">
          <thead>
            <tr>
              <th className="p-2 border">Code</th>
              <th className="p-2 border">Discount %</th>
              <th className="p-2 border">Expires</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id}>
                <td className="p-2 border">{c.code}</td>
                <td className="p-2 border">{c.discount_percent}</td>
                <td className="p-2 border">{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : ""}</td>
                <td className="p-2 border space-x-2">
                  <Link href={`/dashboard/instructor/coupons/edit/${c.id}`}>Edit</Link>
                  <button onClick={() => handleDelete(c.id)} className="text-red-600">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </InstructorLayout>
  );
}
