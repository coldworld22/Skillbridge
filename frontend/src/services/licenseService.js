import api from "@/services/api/api";

export async function verifyLicense(purchaseCode, domain) {
  const { data } = await api.post("/license/verify", {
    purchase_code: purchaseCode,
    domain,
  });
  return data;
}

