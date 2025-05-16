import { useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import {
  FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff, FaStar, FaExchangeAlt
} from "react-icons/fa";
import Link from "next/link";

// Mock Data with Monthly & Yearly Plans
const mockPlans = [
  {
    id: 1,
    name: "Basic Plan",
    price: "$10/month",
    duration: "Monthly",
    popular: false,
    active: true,
    color: "bg-gray-800",
    textColor: "text-white"
  },
  {
    id: 2,
    name: "Regular Plan",
    price: "$20/month",
    duration: "Monthly",
    popular: false,
    active: true,
    color: "bg-yellow-500",
    textColor: "text-gray-900"
  },
  {
    id: 3,
    name: "Premium Plan",
    price: "$30/month",
    duration: "Monthly",
    popular: true,
    active: true,
    color: "bg-yellow-500",
    textColor: "text-gray-900"
  },
  {
    id: 4,
    name: "Premium Yearly",
    price: "$300/year",
    duration: "Yearly",
    popular: true,
    active: true,
    color: "bg-purple-600",
    textColor: "text-white"
  },
  {
    id: 5,
    name: "Basic Yearly",
    price: "$100/year",
    duration: "Yearly",
    popular: false,
    active: true,
    color: "bg-gray-600",
    textColor: "text-white"
  },
  {
    id: 6,
    name: "Regular Yearly",
    price: "$200/year",
    duration: "Yearly",
    popular: false,
    active: true,
    color: "bg-indigo-600",
    textColor: "text-white"
  }
];

export default function PlansIndex() {
  const [plans, setPlans] = useState(mockPlans);

  const toggleActive = (id) => {
    setPlans((prev) =>
      prev.map((plan) =>
        plan.id === id ? { ...plan, active: !plan.active } : plan
      )
    );
  };

  const deletePlan = (id) => {
    if (confirm("Are you sure you want to delete this plan?")) {
      setPlans((prev) => prev.filter((plan) => plan.id !== id));
    }
  };

  const monthlyPlans = plans.filter((p) => p.duration === "Monthly");
  const yearlyPlans = plans.filter((p) => p.duration === "Yearly");

  const renderPlanCards = (planList) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {planList.map((plan) => (
        <div
          key={plan.id}
          className={`rounded-2xl overflow-hidden shadow-md transform hover:scale-[1.02] transition-all duration-300 border border-gray-200 ${plan.color} ${plan.textColor}`}
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-extrabold">{plan.name}</h2>
              {plan.popular && (
                <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-3 py-1 rounded-full inline-flex items-center gap-1">
                  <FaStar className="text-yellow-500" /> Popular
                </span>
              )}
            </div>

            <p className="text-2xl font-bold mb-2">{plan.price}</p>
            <p className="text-sm opacity-90 mb-4">{plan.duration}</p>

            <div className="flex flex-wrap gap-2 mt-auto">
              <Link href={`/dashboard/admin/plans/edit/${plan.id}`}>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm flex items-center gap-1">
                  <FaEdit /> Edit
                </button>
              </Link>
              <button
                onClick={() => deletePlan(plan.id)}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm flex items-center gap-1"
              >
                <FaTrash /> Delete
              </button>
              <button
                onClick={() => toggleActive(plan.id)}
                className={`${
                  plan.active ? "bg-green-600" : "bg-gray-500"
                } hover:opacity-90 text-white px-3 py-1.5 rounded text-sm flex items-center gap-1`}
              >
                {plan.active ? <FaToggleOn /> : <FaToggleOff />}
                {plan.active ? "Active" : "Inactive"}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <AdminLayout title="Manage Subscription Plans">
      <div className="bg-white rounded-xl p-6 shadow mb-10">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <h1 className="text-3xl font-bold text-gray-800">📦 Subscription Plans</h1>
          <div className="flex gap-3">
          
            <Link href="/dashboard/admin/plans/create">
              <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow">
                <FaPlus /> Add Plan
              </button>
            </Link>
          </div>
        </div>

        <hr className="mb-8 border-t border-gray-300" />

        <div className="space-y-12">
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-gray-700">📆 Monthly Plans</h2>
            {renderPlanCards(monthlyPlans)}
          </div>

          <hr className="my-10 border-t border-gray-200" />

          <div>
            <h2 className="text-2xl font-semibold mb-4 text-gray-700">📅 Yearly Plans</h2>
            {renderPlanCards(yearlyPlans)}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
