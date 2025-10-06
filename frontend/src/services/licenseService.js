import api from "@/services/api/api";

export async function verifyLicense(purchaseCode, domain) {
  const payload = {
    purchase_code: purchaseCode,
    ...(domain ? { domain } : {}),
  };
  const { data } = await api.post("license/verify", payload);
  return data;
}
