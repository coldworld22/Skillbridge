import { useEffect, useState } from "react";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import { fetchPublicPlans } from "@/services/public/planService";
import useAuthStore from "@/store/auth/authStore";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../next-i18next.config.js";

export default function InstructorPlansPage() {
  const [plans, setPlans] = useState([]);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  useEffect(() => {
    fetchPublicPlans("instructor").then(setPlans).catch(() => {});
  }, []);

  const handleSubscribe = (id) => {
    router.push(`/payments/checkout?itemType=plan&itemId=${id}`);
  };

  return (
    <InstructorLayout title="Plans">
      <h1 className="text-2xl font-semibold mb-4">Choose a Plan</h1>
      <div className="grid md:grid-cols-3 gap-4">
        {plans.map((p) => (
          <div key={p.id} className="border p-4 rounded">
            <h3 className="text-xl font-bold mb-2">{p.name}</h3>
            <p className="mb-1">Max Courses: {p.max_courses ?? 'Unlimited'}</p>
            <p className="mb-1">Ad Credits: {p.ad_credits ?? 0}</p>
            <button
              onClick={() => handleSubscribe(p.id)}
              className="mt-2 bg-blue-600 text-white px-3 py-1 rounded"
            >
              {user?.plan_id === p.id ? 'Current Plan' : 'Select Plan'}
            </button>
          </div>
        ))}
      </div>
    </InstructorLayout>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["dashboard"], nextI18NextConfig)),
    },
  };
}
