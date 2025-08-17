import { useState } from "react";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";

import AdminLayout from "@/components/layouts/AdminLayout";
import {
  createCoupon,
  validateCode,
} from "@/services/admin/couponService";

const couponSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(1, "Code is required")
      .transform((val) => val.toUpperCase())
      .superRefine(async (val, ctx) => {
        try {
          await validateCode(val);
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Code already exists",
          });
        } catch (err) {
          if (err?.response?.status !== 404) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Failed to validate code",
            });
          }
        }
      }),
    discount_percent: z.coerce.number().int().min(1).max(100),
    starts_at: z.string().optional(),
    expires_at: z.string().optional(),
    usage_limit: z.preprocess(
      (val) =>
        val === "" || val === null || typeof val === "undefined"
          ? undefined
          : Number(val),
      z.number().int().positive().optional()
    ),
    applies_to: z.enum(["plan", "class", "tutorial"]),
    applies_to_id: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.starts_at && data.expires_at) {
        return new Date(data.starts_at) < new Date(data.expires_at);
      }
      return true;
    },
    {
      message: "Start date must be before expiration",
      path: ["expires_at"],
    }
  );

export default function NewCouponPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: "",
      discount_percent: 10,
      starts_at: "",
      expires_at: "",
      usage_limit: "",
      applies_to: "plan",
      applies_to_id: "",
    },
  });

  const onSubmit = async (data) => {
    setServerError(null);
    try {
      await createCoupon({
        ...data,
        starts_at: data.starts_at || undefined,
        expires_at: data.expires_at || undefined,
        usage_limit: data.usage_limit ?? undefined,
        applies_to_id: data.applies_to_id || undefined,
      });
      toast.success("Coupon created successfully");
      router.push("/dashboard/admin/coupons");
    } catch (err) {
      const message =
        err?.response?.data?.message || err?.message || "Failed to create coupon";
      setServerError(message);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-lg">
        <h1 className="text-2xl font-bold mb-4">New Coupon</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <p className="text-red-600 text-sm">{serverError}</p>
          )}
          <div>
            <input
              {...register("code")}
              placeholder="CODE"
              className="border p-2 w-full"
            />
            {errors.code && (
              <p className="text-red-600 text-sm">{errors.code.message}</p>
            )}
          </div>
          <div>
            <input
              type="number"
              {...register("discount_percent")}
              className="border p-2 w-full"
              min="1"
              max="100"
            />
            {errors.discount_percent && (
              <p className="text-red-600 text-sm">
                {errors.discount_percent.message}
              </p>
            )}
          </div>
          <div>
            <input
              type="datetime-local"
              {...register("starts_at")}
              className="border p-2 w-full"
            />
            {errors.starts_at && (
              <p className="text-red-600 text-sm">{errors.starts_at.message}</p>
            )}
          </div>
          <div>
            <input
              type="datetime-local"
              {...register("expires_at")}
              className="border p-2 w-full"
            />
            {errors.expires_at && (
              <p className="text-red-600 text-sm">
                {errors.expires_at.message}
              </p>
            )}
          </div>
          <div>
            <input
              type="number"
              {...register("usage_limit")}
              placeholder="Usage Limit"
              className="border p-2 w-full"
            />
            {errors.usage_limit && (
              <p className="text-red-600 text-sm">
                {errors.usage_limit.message}
              </p>
            )}
          </div>
          <div>
            <select
              {...register("applies_to")}
              className="border p-2 w-full"
            >
              <option value="plan">Plan</option>
              <option value="class">Class</option>
              <option value="tutorial">Tutorial</option>
            </select>
          </div>
          <div>
            <input
              {...register("applies_to_id")}
              placeholder="Target ID"
              className="border p-2 w-full"
            />
            {errors.applies_to_id && (
              <p className="text-red-600 text-sm">
                {errors.applies_to_id.message}
              </p>
            )}
          </div>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save"}
          </button>
        </form>
      </div>
    </AdminLayout>
  );
}

