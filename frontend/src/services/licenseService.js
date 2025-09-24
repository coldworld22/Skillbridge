import api from "@/services/api/api";

/**
 * Verify a purchase code during the installer flow.
 * Returns the API payload on success.
 */
export const verifyLicense = async (purchaseCode, domain) => {
  const payload = { purchase_code: purchaseCode };

  if (typeof domain !== "undefined") {
    payload.domain = domain;
  }

  const { data } = await api.post("/license/verify", payload);
  return data;
};
