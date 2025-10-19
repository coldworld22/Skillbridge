import InstructorLayout from "@/components/layouts/InstructorLayout";
import { useEffect, useMemo, useState } from "react";
import { fetchInstructorClasses } from "@/services/instructor/classService";
import { fetchInstructorPayments } from "@/services/instructor/paymentService";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../next-i18next.config.js";

const extractDate = (payment) => payment.paid_at || payment.created_at;

export default function InstructorClassBreakdownPage() {
  const { t } = useTranslation(["instructor-payments", "dashboard"]);
  const [classes, setClasses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [classData, paymentData] = await Promise.all([
          fetchInstructorClasses(),
          fetchInstructorPayments({ itemType: "class" }),
        ]);
        if (!active) return;
        setClasses(classData || []);
        setPayments(paymentData || []);
      } catch (err) {
        console.error("Failed to load class breakdown", err);
        if (active)
          setError(
            t("instructor-payments:common.messages.errors.class_breakdown")
          );
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [t]);

  const paymentSummary = useMemo(() => {
    const map = new Map();
    payments.forEach((payment) => {
      const id = payment.item_id || payment.id;
      const entry = map.get(id) || {
        gross: 0,
        net: 0,
        commission: 0,
        paidStudents: 0,
        currency: payment.currency || "USD",
        lastPaymentAt: extractDate(payment),
      };
      const gross = Number(payment.amount ?? 0);
      const net = Number(payment.instructor_amount ?? 0);
      const fee =
        payment.platform_fee !== undefined
          ? Number(payment.platform_fee ?? 0)
          : gross - net;

      entry.gross += gross;
      entry.net += net;
      entry.commission += fee;
      if (payment.status === "paid") {
        entry.paidStudents += 1;
      }
      const paymentDate = extractDate(payment);
      if (
        paymentDate &&
        (!entry.lastPaymentAt ||
          new Date(paymentDate) > new Date(entry.lastPaymentAt))
      ) {
        entry.lastPaymentAt = paymentDate;
      }
      entry.currency = payment.currency || entry.currency;
      map.set(id, entry);
    });
    return map;
  }, [payments]);

  const combinedRows = useMemo(() => {
    const rows = classes.map((cls) => {
      const summary = paymentSummary.get(cls.id) || {
        gross: 0,
        net: 0,
        commission: 0,
        paidStudents: 0,
        currency: "USD",
        lastPaymentAt: null,
      };
      return {
        id: cls.id,
        title: cls.title || t("instructor-payments:dashboard.transactions.untitled"),
        scheduleStatus: cls.scheduleStatus || "—",
        publishStatus: cls.publishStatus || "—",
        students: summary.paidStudents,
        price: cls.price ?? "",
        gross: summary.gross,
        net: summary.net,
        commission: summary.commission,
        currency: summary.currency,
        updatedAt: summary.lastPaymentAt,
      };
    });

    paymentSummary.forEach((summary, id) => {
      if (rows.find((row) => row.id === id)) return;
      rows.push({
        id,
        title: t("instructor-payments:classBreakdown.rows.archived_title"),
        scheduleStatus: t(
          "instructor-payments:classBreakdown.rows.archived_status"
        ),
        publishStatus: t(
          "instructor-payments:classBreakdown.rows.archived_status"
        ),
        students: summary.paidStudents,
        price: "",
        gross: summary.gross,
        net: summary.net,
        commission: summary.commission,
        currency: summary.currency,
        updatedAt: summary.lastPaymentAt,
      });
    });

    return rows;
  }, [classes, paymentSummary, t]);

  const filteredRows = useMemo(() => {
    if (filter === "all") return combinedRows;
    const normalized = filter.toLowerCase();
    return combinedRows.filter((row) => {
      const schedule = (row.scheduleStatus || "").toLowerCase();
      const publish = (row.publishStatus || "").toLowerCase();
      if (normalized === "live") {
        return schedule === "ongoing" || schedule === "live";
      }
      if (normalized === "completed") {
        return schedule === "completed";
      }
      if (normalized === "draft") {
        return publish === "draft";
      }
      return schedule === normalized || publish === normalized;
    });
  }, [combinedRows, filter]);

  if (loading) {
    return (
      <InstructorLayout>
        <div className="p-6">
          {t("instructor-payments:common.messages.loading.class_breakdown")}
        </div>
      </InstructorLayout>
    );
  }

  if (error) {
    return (
      <InstructorLayout>
        <div className="p-6 text-red-600">{error}</div>
      </InstructorLayout>
    );
  }

  return (
    <InstructorLayout>
      <div className="p-6 space-y-6 text-gray-800">
        <h1 className="text-2xl font-bold">
          {t("instructor-payments:classBreakdown.title")}
        </h1>

        <div className="flex gap-4 items-center">
          <label className="font-medium">
            {t("instructor-payments:classBreakdown.filter_label")}
          </label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border px-3 py-2 rounded"
          >
            <option value="all">
              {t("instructor-payments:classBreakdown.filters.all")}
            </option>
            <option value="live">
              {t("instructor-payments:classBreakdown.filters.live")}
            </option>
            <option value="completed">
              {t("instructor-payments:classBreakdown.filters.completed")}
            </option>
            <option value="draft">
              {t("instructor-payments:classBreakdown.filters.draft")}
            </option>
          </select>
        </div>

        <div className="bg-white p-6 rounded-xl shadow overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-3">
                  {t("instructor-payments:common.tables.class")}
                </th>
                <th className="p-3">
                  {t("instructor-payments:common.tables.schedule")}
                </th>
                <th className="p-3">
                  {t("instructor-payments:common.tables.publish")}
                </th>
                <th className="p-3">
                  {t("instructor-payments:common.tables.students_paid")}
                </th>
                <th className="p-3">
                  {t("instructor-payments:common.tables.gross")}
                </th>
                <th className="p-3">
                  {t("instructor-payments:common.tables.commission")}
                </th>
                <th className="p-3">
                  {t("instructor-payments:common.tables.net")}
                </th>
                <th className="p-3">
                  {t("instructor-payments:common.tables.last_payment")}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length > 0 ? (
                filteredRows.map((row) => (
                  <tr key={row.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{row.title}</td>
                    <td className="p-3">{row.scheduleStatus}</td>
                    <td className="p-3">{row.publishStatus}</td>
                    <td className="p-3">{row.students}</td>
                    <td className="p-3 text-gray-700">
                      {formatCurrency(row.gross, {
                        currency: row.currency,
                      })}
                    </td>
                    <td className="p-3 text-red-500">
                      {formatCurrency(row.commission, {
                        currency: row.currency,
                      })}
                    </td>
                    <td className="p-3 text-green-600 font-semibold">
                      {formatCurrency(row.net, {
                        currency: row.currency,
                      })}
                    </td>
                    <td className="p-3 text-sm text-gray-500">
                      {formatDate(row.updatedAt)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-gray-500">
                    {t("instructor-payments:common.empty.classes_filter")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
