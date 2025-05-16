import InstructorLayout from "@/components/layouts/InstructorLayout";
import { FaPercentage, FaWallet, FaClock, FaMoneyBillWave, FaExclamationTriangle, FaEnvelope } from "react-icons/fa";

export default function PayoutPolicyPage() {
  return (
    <InstructorLayout>
      <div className="p-6 max-w-4xl mx-auto text-gray-800 space-y-10">
        <h1 className="text-3xl font-bold text-yellow-600 mb-4">💼 Payout Policy</h1>

        {/* Platform Commission */}
        <section className="bg-white rounded-xl shadow p-6 space-y-3 border-l-4 border-yellow-500">
          <div className="flex items-center gap-3">
            <FaPercentage className="text-yellow-600 text-xl" />
            <h2 className="text-xl font-semibold">Platform Commission</h2>
          </div>
          <p className="text-gray-700">
            We charge a fixed <strong className="text-yellow-600">20%</strong> commission on all earnings. This covers payment processing, infrastructure, and marketing efforts.
          </p>
        </section>

        {/* Payout Methods */}
        <section className="bg-white rounded-xl shadow p-6 space-y-3 border-l-4 border-yellow-500">
          <div className="flex items-center gap-3">
            <FaWallet className="text-yellow-600 text-xl" />
            <h2 className="text-xl font-semibold">Payout Methods</h2>
          </div>
          <ul className="list-disc ml-6 text-gray-700 space-y-2">
            <li><strong>Bank Transfer:</strong> Global transfers using IBAN & SWIFT.</li>
            <li><strong>PayPal:</strong> Fast payouts (1–3 business days).</li>
            <li><strong>Moyasar:</strong> Available in MENA region (coming soon).</li>
            <li><strong>NFT Wallet:</strong> For verified SkillBridge NFT holders (beta).</li>
          </ul>
        </section>

        {/* Payout Schedule */}
        <section className="bg-white rounded-xl shadow p-6 space-y-3 border-l-4 border-yellow-500">
          <div className="flex items-center gap-3">
            <FaClock className="text-yellow-600 text-xl" />
            <h2 className="text-xl font-semibold">Payout Schedule</h2>
          </div>
          <p className="text-gray-700">
            Earnings become eligible <strong>7 days after a class ends</strong>. Payouts are processed on <strong className="text-yellow-600">Mondays and Thursdays</strong>.
          </p>
        </section>

        {/* Minimum Withdrawal */}
        <section className="bg-white rounded-xl shadow p-6 space-y-3 border-l-4 border-yellow-500">
          <div className="flex items-center gap-3">
            <FaMoneyBillWave className="text-yellow-600 text-xl" />
            <h2 className="text-xl font-semibold">Minimum Withdrawal</h2>
          </div>
          <p className="text-gray-700">
            Minimum payout is <strong className="text-yellow-600">$50</strong>. Requests below this will remain pending.
          </p>
        </section>

        {/* Tax & Deductions */}
        <section className="bg-white rounded-xl shadow p-6 space-y-3 border-l-4 border-yellow-500">
          <div className="flex items-center gap-3">
            <FaExclamationTriangle className="text-yellow-600 text-xl" />
            <h2 className="text-xl font-semibold">Tax & Deductions</h2>
          </div>
          <p className="text-gray-700">
            Depending on your country, we may deduct taxes or provide forms for self-reporting. Additional transaction fees may apply based on your chosen method.
          </p>
        </section>

        {/* Support */}
        <section className="bg-white rounded-xl shadow p-6 space-y-3 border-l-4 border-yellow-500">
          <div className="flex items-center gap-3">
            <FaEnvelope className="text-yellow-600 text-xl" />
            <h2 className="text-xl font-semibold">Support</h2>
          </div>
          <p className="text-gray-700">
            Questions? Email us at <a href="mailto:support@skillbridge.com" className="text-yellow-600 underline">support@skillbridge.com</a>.
          </p>
        </section>
      </div>
    </InstructorLayout>
  );
}
