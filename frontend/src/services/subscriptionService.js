import api from "@/services/api/api";

export const subscribeToPlan = async (
  planId,
  interval = "monthly",
  paymentId
) => {
  const payload = { plan_id: planId, interval };
  if (paymentId) payload.payment_id = paymentId;
  const { data } = await api.post("/user-subscriptions", payload);
  return { subscription: data?.data ?? null, message: data?.message };
};

export const fetchMySubscription = async () => {
  const { data } = await api.get("/user-subscriptions/me");
  return data?.data ?? null;
};

export const fetchSubscriptionSummary = async () => {
  const { data } = await api.get("/user-subscriptions/summary");
  return data?.data ?? null;
};

export const fetchSubscriptionHistory = async () => {
  const { data } = await api.get("/user-subscriptions/history");
  return data?.data ?? [];
};
