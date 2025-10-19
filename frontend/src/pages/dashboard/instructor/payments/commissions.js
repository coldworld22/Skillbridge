import InstructorLayout from "@/components/layouts/InstructorLayout";
import { FaInfoCircle, FaFileDownload } from "react-icons/fa";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../next-i18next.config.js";

const mockSummaryBase = {
  commissionRate: 20,
  totalEarnings: 1200,
  platformCut: 240,
  netEarnings: 960,
  deductions: [
    { id: 1, label: "Transaction Fees", amount: 18 },
    { id: 2, label: "Tax Deduction", amount: 22 },
  ],
  breakdown: [
    { id: 1, title: "React Basics", amount: 400, commission: 80 },
    { id: 2, title: "Node.js Course", amount: 300, commission: 60 },
    { id: 3, title: "AI Tutorial", amount: 500, commission: 100 },
  ],
};

export default function InstructorCommissionPage() {
  const { t } = useTranslation(["instructor-payments", "dashboard"]);

  // Clone to avoid accidental mutations
  const mockSummary = mockSummaryBase;

  const totalDeductions = mockSummary.deductions.reduce(
    (sum, d) => sum + d.amount,
    0
  );
  const finalPayout = mockSummary.netEarnings - totalDeductions;

  const exportCSV = () => {
    const headers = [
      t("instructor-payments:commissions.breakdown.headers.title"),
      t("instructor-payments:commissions.breakdown.headers.amount"),
      t("instructor-payments:commissions.breakdown.headers.commission"),
    ];
    const rows = mockSummary.breakdown.map((item) => [
      item.title,
      item.amount,
      item.commission,
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = t("instructor-payments:commissions.export.filename");
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <InstructorLayout>
      <div className="p-6 max-w-3xl mx-auto text-gray-800 space-y-6">
        <h1 className="text-2xl font-bold">
          {t("instructor-payments:commissions.title")}
        </h1>

        <div className="bg-white p-6 rounded-xl shadow space-y-6">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <p className="text-lg font-medium">
                {t("instructor-payments:commissions.summary.commission_rate")}:{" "}
                <span className="text-yellow-600 font-bold">
                  {mockSummary.commissionRate}%
                </span>
              </p>
              <p>
                {t("instructor-payments:commissions.summary.total_earnings")}:{" "}
                <span className="font-semibold">
                  ${mockSummary.totalEarnings}
                </span>
              </p>
              <p className="text-red-600">
                {t("instructor-payments:commissions.summary.platform_cut")}: -$
                {mockSummary.platformCut}
              </p>
              <p className="text-green-600">
                {t("instructor-payments:commissions.summary.net_earnings")}: $
                {mockSummary.netEarnings}
              </p>
            </div>
            <div className="text-gray-500 text-sm flex items-center gap-2 max-w-sm">
              <FaInfoCircle className="text-yellow-500 flex-shrink-0" />
              {t("instructor-payments:commissions.info_note")}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">
              {t("instructor-payments:commissions.breakdown.title")}
            </h2>
            <table className="w-full table-auto border text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left">
                    {t("instructor-payments:commissions.breakdown.headers.title")}
                  </th>
                  <th className="p-2 text-left">
                    {t("instructor-payments:commissions.breakdown.headers.amount")}
                  </th>
                  <th className="p-2 text-left">
                    {t(
                      "instructor-payments:commissions.breakdown.headers.commission"
                    )}
                  </th>
                </tr>
              </thead>
              <tbody>
                {mockSummary.breakdown.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="p-2">{item.title}</td>
                    <td className="p-2">${item.amount}</td>
                    <td className="p-2 text-red-500">-${item.commission}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              onClick={exportCSV}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded"
            >
              <FaFileDownload />{" "}
              {t("instructor-payments:common.buttons.export_csv")}
            </button>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">
              {t("instructor-payments:commissions.deductions.title")}
            </h2>
            <ul className="space-y-2">
              {mockSummary.deductions.map((item) => (
                <li key={item.id} className="flex justify-between border-b pb-2">
                  <span>{item.label}</span>
                  <span className="text-red-500">-${item.amount}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-4 border-t">
            <p className="font-medium text-lg">
              {t("instructor-payments:commissions.final_payout")}:{" "}
              <span className="text-green-700 font-bold">${finalPayout}</span>
            </p>
          </div>
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
