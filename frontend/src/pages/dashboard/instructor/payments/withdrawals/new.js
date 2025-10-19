import { useEffect, useState } from "react";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import { useRouter } from "next/router";
import {
  fetchInstructorPaymentSummary,
  requestInstructorWithdrawal,
} from "@/services/instructor/paymentService";
import { formatCurrency } from "@/utils/currency";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../next-i18next.config.js";

export default function InstructorNewWithdrawalPage() {
  const { t } = useTranslation(["instructor-payments", "dashboard"]);
  const router = useRouter();
  const [form, setForm] = useState({
    amount: "",
    method: "Bank Transfer",
    details: "",
  });
  const [availableBalance, setAvailableBalance] = useState(0);
  const [minimumPayoutAmount, setMinimumPayoutAmount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let active = true;
    fetchInstructorPaymentSummary()
      .then((summary) => {
        if (!active) return;

        const balance = Number(
          summary?.availableForWithdrawal ?? summary?.walletBalance ?? 0
        );
        setAvailableBalance(Number.isFinite(balance) ? balance : 0);

        const configuredMinimum = Number(
          summary?.minimumWithdrawalAmount ??
            summary?.minimumPayoutAmount ??
            summary?.minimum_payout_amount ??
            0
        );
        setMinimumPayoutAmount(
          Number.isFinite(configuredMinimum) ? configuredMinimum : 0
        );
      })
      .catch((err) => {
        console.error("Failed to load wallet balance", err);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amountValue = Number(form.amount);
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      setMessage({
        type: "error",
        text: t("instructor-payments:common.messages.validation.invalid_amount"),
      });
      return;
    }

    if (amountValue > availableBalance) {
      setMessage({
        type: "error",
        text: t("instructor-payments:common.messages.validation.exceeds_balance"),
      });
      return;
    }

    if (minimumPayoutAmount > 0 && amountValue < minimumPayoutAmount) {
      setMessage({
        type: "error",
        text: t("instructor-payments:common.messages.validation.below_minimum", {
          amount: formatCurrency(minimumPayoutAmount),
        }),
      });
      return;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      await requestInstructorWithdrawal({
        amount: amountValue,
        method: form.method,
        details: form.details,
      });
      setMessage({
        type: "success",
        text: t(
          "instructor-payments:common.messages.success.withdrawal_submitted"
        ),
      });
      setForm({ amount: "", method: "Bank Transfer", details: "" });
      setTimeout(() => {
        router.push("/dashboard/instructor/payments/withdrawals");
      }, 1500);
    } catch (err) {
      const apiMessage =
        err?.response?.data?.message ||
        t("instructor-payments:common.messages.errors.withdrawals");
      setMessage({ type: "error", text: apiMessage });
    } finally {
      setSubmitting(false);
    }
  };

  const meetsMinimumRequirement =
    Number.isFinite(minimumPayoutAmount) && minimumPayoutAmount > 0
      ? availableBalance >= minimumPayoutAmount
      : availableBalance > 0;

  return (
    <InstructorLayout>
      <div className="p-6 max-w-xl mx-auto text-gray-800">
        <h1 className="text-2xl font-bold mb-4">
          {t("instructor-payments:withdrawalsNew.title")}
        </h1>

        <div className="mb-4 bg-blue-50 border border-blue-100 text-blue-800 p-4 rounded-lg">
          <p className="text-sm uppercase tracking-wide">
            {t("instructor-payments:common.labels.available_balance")}
          </p>
          <p className="text-lg font-semibold">
            {formatCurrency(availableBalance)}
          </p>
          <div className="space-y-1 mt-2 text-xs text-blue-600">
            <p>
              {t(
                "instructor-payments:withdrawalsNew.labels.requests_above_balance"
              )}
            </p>
            {minimumPayoutAmount > 0 && (
              <p>
                {t("instructor-payments:common.labels.minimum_withdrawal")}{" "}
                <span className="font-semibold">
                  {formatCurrency(minimumPayoutAmount)}
                </span>
              </p>
            )}
          </div>
        </div>

        {!meetsMinimumRequirement && minimumPayoutAmount > 0 && (
          <div className="mb-4 p-3 rounded bg-yellow-100 border border-yellow-200 text-yellow-800 text-sm">
            {t(
              "instructor-payments:common.messages.info.below_minimum_notice"
            )}
          </div>
        )}

        {message && (
          <div
            className={`mb-4 p-3 rounded ${
              message.type === "success"
                ? "bg-green-100 text-green-700 border border-green-200"
                : "bg-red-100 text-red-700 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-6 bg-white p-6 rounded-xl shadow"
        >
          <div>
            <label className="block mb-1 font-medium">
              {t("instructor-payments:withdrawalsNew.form.amount")}
            </label>
            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              className="w-full border px-4 py-2 rounded"
              required
              min={minimumPayoutAmount > 0 ? minimumPayoutAmount : 1}
              step="0.01"
              disabled={!meetsMinimumRequirement}
            />
            {minimumPayoutAmount > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {t("instructor-payments:common.messages.validation.at_least_amount", {
                  amount: formatCurrency(minimumPayoutAmount),
                })}
              </p>
            )}
          </div>

          <div>
            <label className="block mb-1 font-medium">
              {t("instructor-payments:withdrawalsNew.form.payment_method")}
            </label>
            <select
              name="method"
              value={form.method}
              onChange={handleChange}
              className="w-full border px-4 py-2 rounded"
              disabled={!meetsMinimumRequirement}
            >
              <option value="Bank Transfer">
                {t("instructor-payments:settings.methods.bank_transfer")}
              </option>
              <option value="PayPal">
                {t("instructor-payments:settings.methods.paypal")}
              </option>
            </select>
          </div>

          <div>
            <label className="block mb-1 font-medium">
              {form.method === "PayPal"
                ? t("instructor-payments:withdrawalsNew.form.paypal_email")
                : t("instructor-payments:withdrawalsNew.form.bank_details")}
            </label>
            <textarea
              name="details"
              value={form.details}
              onChange={handleChange}
              className="w-full border px-4 py-2 rounded h-24"
              placeholder={
                form.method === "PayPal"
                  ? t("instructor-payments:withdrawalsNew.placeholders.paypal_email")
                  : t("instructor-payments:withdrawalsNew.placeholders.bank_details")
              }
              required
              disabled={!meetsMinimumRequirement}
            />
          </div>

          <button
            type="submit"
            className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-2 rounded font-medium disabled:opacity-60"
            disabled={submitting || !meetsMinimumRequirement}
          >
            {submitting
              ? t("instructor-payments:common.buttons.submitting")
              : t("instructor-payments:common.buttons.submit_request")}
          </button>
        </form>
      </div>
    </InstructorLayout>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(
        locale,
        ["dashboard", "instructor-payments"],
        nextI18NextConfig
      )),
    },
  };
}
