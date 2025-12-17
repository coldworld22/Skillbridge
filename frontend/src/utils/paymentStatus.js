const STATUS_BADGE_MAP = {
  paid: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  failed: "bg-red-100 text-red-800",
  rejected: "bg-red-100 text-red-800",
  refunded: "bg-gray-100 text-gray-800",
};

export const normalizePaymentStatus = (status) => {
  const normalized = (status || "").toString().toLowerCase();

  if (["approved", "paid", "success", "complete", "completed"].includes(normalized)) {
    return "paid";
  }

  if (
    [
      "pending",
      "pending_payment",
      "awaiting_payment",
      "awaiting_approval",
      "in_review",
      "processing",
    ].includes(normalized)
  ) {
    return "pending";
  }

  if (["rejected", "declined", "canceled", "cancelled"].includes(normalized)) {
    return "rejected";
  }

  if (["failed", "error"].includes(normalized)) {
    return "failed";
  }

  if (normalized === "refunded") {
    return "refunded";
  }

  return normalized || "pending";
};

export const getStatusBadgeClass = (status) => {
  const key = normalizePaymentStatus(status);
  return STATUS_BADGE_MAP[key] || "bg-gray-100 text-gray-800";
};

export const mapUiStatusToApiStatus = (status) => {
  const normalized = normalizePaymentStatus(status);
  if (normalized === "paid") return "approved";
  if (normalized === "pending") return "pending";
  if (normalized === "rejected") return "rejected";
  if (normalized === "failed") return "rejected";
  if (normalized === "refunded") return "refunded";
  return normalized;
};
