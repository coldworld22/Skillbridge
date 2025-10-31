import api from "@/services/api/api";

const unwrap = (response) => response?.data?.data ?? response?.data ?? response;

export const fetchInstructorPaymentSummary = async () => {
  const response = await api.get("/payments/instructor/summary");
  return unwrap(response);
};

export const fetchInstructorPayments = async (params = {}) => {
  const response = await api.get("/payments/instructor", { params });
  return unwrap(response);
};

export const fetchInstructorBillingPayments = async (params = {}) => {
  const response = await api.get("/payments/me", { params });
  return unwrap(response);
};

export const fetchInstructorWithdrawals = async () => {
  const response = await api.get("/payouts/history");
  return unwrap(response);
};

export const requestInstructorWithdrawal = async ({
  amount,
  method,
  details,
  currency = "USD",
} = {}) => {
  const notes = [method ? `Method: ${method}` : null, details ? `Details: ${details}` : null]
    .filter(Boolean)
    .join("\n")
    .trim();

  const payload = {
    amount,
    currency,
    ...(notes ? { notes } : {}),
  };

  const response = await api.post("/payouts/request", payload);
  return unwrap(response);
};
