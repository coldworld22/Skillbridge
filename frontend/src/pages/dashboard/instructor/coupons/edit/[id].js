import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import {
  fetchCouponById,
  fetchCouponTargets,
  updateCoupon,
} from "@/services/instructor/couponService";

const scopeOptions = [
  { value: "class", label: "Class" },
  { value: "tutorial", label: "Tutorial" },
];

const couponSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, "Code must be at least 3 characters")
      .max(32, "Code cannot exceed 32 characters")
      .transform((val) => val.toUpperCase()),
    discount_percent: z.coerce
      .number()
      .int()
      .min(1, "Minimum discount is 1%")
      .max(100, "Maximum discount is 100%"),
    starts_at: z.string().optional(),
    expires_at: z.string().optional(),
    usage_limit: z
      .preprocess((value) => {
        if (value === "" || value === null || value === undefined) return undefined;
        return Number(value);
      }, z.number().int().positive().optional())
      .refine(
        (value) => value === undefined || (Number.isInteger(value) && value > 0),
        "Usage limit must be a positive whole number"
      ),
    applies_to: z.enum(["class", "tutorial"], {
      required_error: "Select a target type",
    }),
    applies_to_id: z.string().uuid("Select the item this coupon applies to"),
  })
  .refine(
    (data) => {
      if (!data.starts_at || !data.expires_at) return true;
      return new Date(data.starts_at) < new Date(data.expires_at);
    },
    {
      message: "End date must be after the start date",
      path: ["expires_at"],
    }
  );

const toDateTimeLocal = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
};

export default function InstructorCouponEdit() {
  const router = useRouter();
  const { id } = router.query;
  const [targets, setTargets] = useState({ classes: [], tutorials: [] });
  const [loading, setLoading] = useState(true);
  const [loadingTargets, setLoadingTargets] = useState(true);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: "",
      discount_percent: 10,
      starts_at: "",
      expires_at: "",
      usage_limit: "",
      applies_to: "class",
      applies_to_id: "",
    },
  });

  const scope = watch("applies_to");
  const selectedItem = watch("applies_to_id");
  const scopeLabel = useMemo(
    () =>
      scopeOptions.find((option) => option.value === scope)?.label || "item",
    [scope]
  );

  useEffect(() => {
    if (!id) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      setLoadingTargets(true);
      try {
        const [coupon, targetData] = await Promise.all([
          fetchCouponById(id),
          fetchCouponTargets(),
        ]);
        if (!active) return;

        if (!coupon) {
          toast.error("Coupon not found");
          router.replace("/dashboard/instructor/coupons");
          return;
        }

        const enrichedTargets = { ...targetData };
        const scopeKey =
          coupon.applies_to === "class"
            ? "classes"
            : coupon.applies_to === "tutorial"
            ? "tutorials"
            : null;
        if (
          scopeKey &&
          coupon.applies_to_id &&
          Array.isArray(enrichedTargets[scopeKey]) &&
          !enrichedTargets[scopeKey].some(
            (item) => item.id === coupon.applies_to_id
          )
        ) {
          enrichedTargets[scopeKey] = [
            ...enrichedTargets[scopeKey],
            {
              id: coupon.applies_to_id,
              title: "Current item (no longer listed)",
              status: "inactive",
            },
          ];
        }

        setTargets(enrichedTargets);

        reset({
          code: coupon.code || "",
          discount_percent: coupon.discount_percent ?? 10,
          starts_at: toDateTimeLocal(coupon.starts_at),
          expires_at: toDateTimeLocal(coupon.expires_at),
          usage_limit:
            coupon.usage_limit === null || coupon.usage_limit === undefined
              ? ""
              : coupon.usage_limit,
          applies_to: coupon.applies_to || "class",
          applies_to_id: coupon.applies_to_id || "",
        });
      } catch (_err) {
        if (!active) return;
        toast.error("Failed to load coupon");
        router.replace("/dashboard/instructor/coupons");
      } finally {
        if (active) {
          setLoading(false);
          setLoadingTargets(false);
        }
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [id, reset, router]);

  const scopedItems = useMemo(() => {
    if (!scope) return [];
    return scope === "class" ? targets.classes || [] : targets.tutorials || [];
  }, [scope, targets]);

  useEffect(() => {
    if (!scope) return;
    const items = scope === "class" ? targets.classes || [] : targets.tutorials || [];
    if (!items.length) {
      setValue("applies_to_id", "");
      return;
    }
    if (!items.some((item) => item.id === selectedItem)) {
      setValue("applies_to_id", items[0].id);
    }
  }, [scope, targets, selectedItem, setValue]);

  const onSubmit = async (values) => {
    setServerError("");
    try {
      await updateCoupon(id, {
        code: values.code,
        discount_percent: values.discount_percent,
        starts_at: values.starts_at || undefined,
        expires_at: values.expires_at || undefined,
        usage_limit:
          typeof values.usage_limit === "number"
            ? values.usage_limit
            : null,
        applies_to: values.applies_to,
        applies_to_id: values.applies_to_id,
      });
      toast.success("Coupon updated successfully");
      router.push("/dashboard/instructor/coupons");
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update coupon";
      setServerError(message);
      toast.error(message);
    }
  };

  return (
    <InstructorLayout>
      <div className="p-6">
        <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white/70 p-6 shadow-sm">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold text-slate-900">
              Edit coupon
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Update the details below. Changes apply immediately to new
              purchases.
            </p>
          </header>

          {loading ? (
            <div className="space-y-4">
              {[...Array(4).keys()].map((key) => (
                <div
                  key={key}
                  className="h-12 animate-pulse rounded-md bg-slate-100"
                />
              ))}
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {serverError && (
                <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {serverError}
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">
                    Coupon code
                  </label>
                  <input
                    {...register("code")}
                    placeholder="e.g. ALUMNI15"
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm uppercase tracking-wide text-slate-900 shadow-inner focus:border-emerald-500 focus:outline-none focus:ring"
                  />
                  {errors.code && (
                    <p className="text-xs text-rose-600">
                      {errors.code.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">
                    Discount %
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    step="1"
                    {...register("discount_percent", { valueAsNumber: true })}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-emerald-500 focus:outline-none focus:ring"
                  />
                  {errors.discount_percent && (
                    <p className="text-xs text-rose-600">
                      {errors.discount_percent.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">
                    Starts at
                  </label>
                  <input
                    type="datetime-local"
                    {...register("starts_at")}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-emerald-500 focus:outline-none focus:ring"
                  />
                  {errors.starts_at && (
                    <p className="text-xs text-rose-600">
                      {errors.starts_at.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">
                    Expires at
                  </label>
                  <input
                    type="datetime-local"
                    {...register("expires_at")}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-emerald-500 focus:outline-none focus:ring"
                  />
                  {errors.expires_at && (
                    <p className="text-xs text-rose-600">
                      {errors.expires_at.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">
                  Usage limit
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="Leave empty for unlimited usage"
                  {...register("usage_limit")}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-emerald-500 focus:outline-none focus:ring"
                />
                {errors.usage_limit && (
                  <p className="text-xs text-rose-600">
                    {errors.usage_limit.message}
                  </p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">
                    Applies to
                  </label>
                  <select
                    {...register("applies_to")}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-emerald-500 focus:outline-none focus:ring"
                  >
                    {scopeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.applies_to && (
                    <p className="text-xs text-rose-600">
                      {errors.applies_to.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">
                    Target {scopeLabel.toLowerCase()}
                  </label>
                  <select
                    {...register("applies_to_id")}
                    disabled={loadingTargets || !scopedItems.length}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-inner focus:border-emerald-500 focus:outline-none focus:ring disabled:cursor-not-allowed disabled:bg-slate-100"
                  >
                    <option value="" disabled>
                      {loadingTargets
                        ? "Loading..."
                        : scopedItems.length
                        ? "Select an item"
                        : "No items available"}
                    </option>
                    {scopedItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.title || "Untitled"}{" "}
                        {item.status ? `(${item.status})` : ""}
                      </option>
                    ))}
                  </select>
                  {errors.applies_to_id && (
                    <p className="text-xs text-rose-600">
                      {errors.applies_to_id.message}
                    </p>
                  )}
                  {!loadingTargets && !scopedItems.length && (
                    <p className="text-xs text-slate-500">
                      No {scope} found. Create one first to attach this coupon.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/dashboard/instructor/coupons")}
                  className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-700"
                >
                  Cancel
                </button>
                <div className="flex items-center gap-2">
                  {!isDirty && (
                    <span className="text-xs text-slate-400">
                      No unsaved changes
                    </span>
                  )}
                  <button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      loadingTargets ||
                      !scopedItems.length ||
                      !isDirty
                    }
                    className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
                  >
                    {isSubmitting ? "Saving..." : "Update coupon"}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </InstructorLayout>
  );
}
