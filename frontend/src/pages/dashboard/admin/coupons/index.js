import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import AdminLayout from "@/components/layouts/AdminLayout";
import { fetchCoupons, deleteCoupon } from "@/services/admin/couponService";
import Link from "next/link";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchCoupons()
      .then(setCoupons)
      .catch(() => {
        setCoupons([]);
        toast.error("Failed to load coupons");
      });
  }, []);

  const isActive = (coupon) => {
    const now = new Date();
    const starts = coupon.starts_at ? new Date(coupon.starts_at) : null;
    const expires = coupon.expires_at ? new Date(coupon.expires_at) : null;
    if (starts && now < starts) return false;
    if (expires && now > expires) return false;
    return true;
  };

  const filteredCoupons = coupons.filter((c) => {
    const matchesCode = c.code
      .toLowerCase()
      .includes(search.toLowerCase());
    const active = isActive(c);
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && active) ||
      (statusFilter === "expired" && !active);
    return matchesCode && matchesStatus;
  });

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
    <AdminLayout>
      <div className="p-6">
        <header className="flex justify-between mb-6">
          <h1 className="text-2xl font-bold">Coupons</h1>
          <Link
            href="/dashboard/admin/coupons/new"
            className="bg-green-600 px-4 py-2 text-white rounded"
          >
            New Coupon
          </Link>
        </header>
        <div className="flex mb-4 space-x-4">
          <input
            type="text"
            placeholder="Search code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border p-2 rounded"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
          </select>
        </div>
        <table className="min-w-full bg-white text-sm">
          <thead>
            <tr>
              <th className="p-2 border">Code</th>
              <th className="p-2 border">Discount %</th>
              <th className="p-2 border">Starts</th>
              <th className="p-2 border">Expires</th>
              <th className="p-2 border">Times Used</th>
              <th className="p-2 border">Usage Limit</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Applies To</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCoupons.map((c) => (
              <tr key={c.id}>
                <td className="p-2 border">{c.code}</td>
                <td className="p-2 border">{c.discount_percent}</td>
                <td className="p-2 border">
                  {c.starts_at ? new Date(c.starts_at).toLocaleDateString() : ""}
                </td>
                <td className="p-2 border">
                  {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : ""}
                </td>
                <td className="p-2 border">{c.times_used}</td>
                <td className="p-2 border">{c.usage_limit ?? ""}</td>
                <td className="p-2 border">{isActive(c) ? "Active" : "Expired"}</td>
                <td className="p-2 border">{c.applies_to || ""}</td>
                <td className="p-2 border space-x-2">
                  <Link href={`/dashboard/admin/coupons/edit/${c.id}`}>Edit</Link>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="text-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
