import api from "@/services/api/api";

export const fetchStudentPlanIdentifiers = async () => {
  const { data } = await api.get("/plans", { params: { role: "student" } });
  const plans = data?.data ?? [];
  return plans
    .filter((plan) => plan?.active !== false)
    .map((plan) => ({
      id: plan.id,
      name: plan.name,
      slug: plan.slug,
    }));
};

export default { fetchStudentPlanIdentifiers };
