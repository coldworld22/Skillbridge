import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import {
  deleteCoupon,
  fetchCoupons,
  fetchCouponTargets,
} from "@/services/instructor/couponService";

const STATUS_COLORS = {
  Active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Upcoming: "bg-sky-100 text-sky-700 border-sky-200",
  Expired: "bg-rose-100 text-rose-700 border-rose-200",
};

const formatDateTime = (value) => {
  if (!value) return "—";
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (_err) {
    return "—";
  }
};

const computeStatus = (coupon) => {
  const now = Date.now();
  const starts = coupon.starts_at ? new Date(coupon.starts_at).getTime() : null;
  const ends = coupon.expires_at
    ? new Date(coupon.expires_at).getTime()
    : null;
  if (starts && starts > now) return "Upcoming";
  if (ends && ends < now) return "Expired";
  return "Active";
};

export default function InstructorCouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [targets, setTargets] = useState({ classes: [], tutorials: [] });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    scope: "all",
  });

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const [list, targetData] = await Promise.all([
          fetchCoupons(),
          fetchCouponTargets(),
        ]);
        if (!active) return;
        setCoupons(list);
        setTargets(targetData);
      } catch (_err) {
        if (!active) return;
        toast.error("Failed to load coupons");
        setCoupons([]);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const lookups = useMemo(() => {
    const classMap = new Map(
      (targets.classes || []).map((item) => [item.id, item])
    );
    const tutorialMap = new Map(
      (targets.tutorials || []).map((item) => [item.id, item])
    );
    return {
      class: classMap,
      tutorial: tutorialMap,
    };
  }, [targets]);

  const resolveScopeLabel = useCallback((coupon) => {
    if (!coupon?.applies_to) return "Applies to all items";
    const map = lookups[coupon.applies_to];
    if (!map) return `Applies to ${coupon.applies_to}`;
    const item = map.get(coupon.applies_to_id);
    if (!item) return `Applies to selected ${coupon.applies_to}`;
    return `${item.title || "Untitled"} (${coupon.applies_to})`;
  }, [lookups]);

  const filteredCoupons = useMemo(() => {
    const searchTerm = filters.search.trim().toLowerCase();
    return coupons.filter((coupon) => {
      const status = computeStatus(coupon);
      const scopeKey = coupon.applies_to || "all";
      const matchesSearch =
        !searchTerm ||
        coupon.code.toLowerCase().includes(searchTerm) ||
        resolveScopeLabel(coupon).toLowerCase().includes(searchTerm);
      const matchesStatus =
        filters.status === "all" || status.toLowerCase() === filters.status;
      const matchesScope =
        filters.scope === "all" ||
        scopeKey === filters.scope ||
        (filters.scope === "ungrouped" && !coupon.applies_to);
      return matchesSearch && matchesStatus && matchesScope;
    });
  }, [coupons, filters, resolveScopeLabel]);

  const handleDelete = async (coupon) => {
    if (
      !confirm(
        `Delete coupon "${coupon.code}"? This action cannot be undone.`
      )
    )
      return;
    try {
      await deleteCoupon(coupon.id);
      setCoupons((prev) => prev.filter((c) => c.id !== coupon.id));
      toast.success("Coupon deleted successfully");
    } catch (_err) {
      toast.error("Failed to delete coupon");
    }
  };

  return (
    <InstructorLayout>
      <div className="p-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Coupons & Promotions
            </h1>
            <p className="text-sm text-slate-500">
              Track your promo codes, monitor usage, and keep them fresh.
            </p>
          </div>
          <Link
            href="/dashboard/instructor/coupons/new"
            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700"
          >
            Create coupon
          </Link>
        </header>

        <section className="mt-6 rounded-lg border border-slate-200 bg-white/60 p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="search"
                value={filters.search}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    search: event.target.value,
                  }))
                }
                placeholder="Search by code or item"
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-emerald-500 focus:outline-none focus:ring"
              />
              <select
                value={filters.status}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    status: event.target.value,
                  }))
                }
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-emerald-500 focus:outline-none focus:ring sm:w-44"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="upcoming">Upcoming</option>
                <option value="expired">Expired</option>
              </select>
              <select
                value={filters.scope}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    scope: event.target.value,
                  }))
                }
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-emerald-500 focus:outline-none focus:ring sm:w-44"
              >
                <option value="all">All items</option>
                <option value="class">Classes</option>
                <option value="tutorial">Tutorials</option>
                <option value="ungrouped">General</option>
              </select>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[...Array(6).keys()].map((key) => (
              <div
                key={key}
                className="h-48 animate-pulse rounded-lg border border-slate-200 bg-slate-100"
              />
            ))}
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="mt-10 flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white/70 p-10 text-center shadow-sm">
            <p className="text-lg font-medium text-slate-700">
              No coupons found
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Create a coupon to reward loyal students or boost a new launch.
            </p>
            <Link
              href="/dashboard/instructor/coupons/new"
              className="mt-4 inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700"
            >
              Add your first coupon
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredCoupons.map((coupon) => {
              const status = computeStatus(coupon);
              const statusClasses =
                STATUS_COLORS[status] ||
                "bg-slate-100 text-slate-700 border-slate-200";
              const usageLimit =
                coupon.usage_limit === null
                  ? "Unlimited"
                  : `${coupon.times_used}/${coupon.usage_limit}`;
              const scopeLabel = resolveScopeLabel(coupon);

              return (
                <article
                  key={coupon.id}
                  className="flex flex-col rounded-xl border border-slate-200 bg-white/60 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-wide text-slate-500">
                        Code
                      </p>
                      <p className="text-xl font-semibold text-slate-900">
                        {coupon.code}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {scopeLabel}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${statusClasses}`}
                    >
                      {status}
                    </span>
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-slate-500">Discount</dt>
                      <dd className="font-semibold text-slate-900">
                        {coupon.discount_percent}%
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Usage</dt>
                      <dd className="font-semibold text-slate-900">
                        {usageLimit}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Starts</dt>
                      <dd className="text-slate-900">
                        {formatDateTime(coupon.starts_at)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Expires</dt>
                      <dd className="text-slate-900">
                        {formatDateTime(coupon.expires_at)}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-4 flex flex-1 items-end justify-between text-sm">
                    <div className="space-y-1 text-xs text-slate-500">
                      <p>Times used: {coupon.times_used ?? 0}</p>
                      <p>
                        Last updated:{" "}
                        {formatDateTime(coupon.updated_at || coupon.created_at)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/dashboard/instructor/coupons/edit/${coupon.id}`}
                        className="rounded-md border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(coupon)}
                        className="rounded-md border border-transparent px-3 py-1 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </InstructorLayout>
  );
}
