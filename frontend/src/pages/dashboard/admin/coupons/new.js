import { useState } from "react";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

import AdminLayout from "@/components/layouts/AdminLayout";
import {
  createCoupon,
  validateCode,
} from "@/services/admin/couponService";
import nextI18NextConfig from "../../../../../next-i18next.config.js";

const createCouponSchema = (t) =>
  z
    .object({
      code: z
        .string()
        .trim()
        .min(1, t("code_required"))
        .transform((val) => val.toUpperCase())
        .superRefine(async (val, ctx) => {
          // Only check availability for codes with minimum valid length
          if (val.length < 3) return;

          try {
            await validateCode(val);
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: t("code_exists"),
            });
          } catch (err) {
            if (err?.response?.status !== 404) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: t("code_validate_failed"),
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
        message: t("start_before_end"),
        path: ["expires_at"],
      }
    );

export default function NewCouponPage() {
  const { t, i18n } = useTranslation("dashboard", { keyPrefix: "couponsPage" });
  const router = useRouter();
  const [serverError, setServerError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createCouponSchema(t)),
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
      toast.success(t("create_success"));
      router.push("/dashboard/admin/coupons");
    } catch (err) {
      const message =
        err?.response?.data?.message || err?.message || t("create_failed");
      setServerError(message);
      toast.error(message);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-lg" dir={i18n.dir()}>
        <h1 className="text-2xl font-bold mb-4">{t("new_coupon")}</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <p className="text-red-600 text-sm">{serverError}</p>
          )}
          <div>
            <input
              {...register("code")}
              placeholder={t("code_placeholder")}
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
              placeholder={t("usage_limit_placeholder")}
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
              <option value="plan">{t("plan")}</option>
              <option value="class">{t("class")}</option>
              <option value="tutorial">{t("tutorial")}</option>
            </select>
          </div>
          <div>
            <input
              {...register("applies_to_id")}
              placeholder={t("target_id_placeholder")}
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
            {isSubmitting ? t("saving") : t("save")}
          </button>
        </form>
      </div>
    </AdminLayout>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["dashboard"], nextI18NextConfig)),
    },
  };
}

