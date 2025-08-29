import api from "@/services/api/api";

export const subscribeToPlan = async (planId) => {
  const { data } = await api.post("/user-subscriptions", { plan_id: planId });
  return data?.data ?? null;
};

export const fetchMySubscription = async () => {
  const { data } = await api.get("/user-subscriptions/me");
  return data?.data ?? null;
};
