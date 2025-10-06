import api from "@/services/api/api";

export async function verifyLicense(purchaseCode, domain) {
  const payload = {
    purchase_code: purchaseCode,
    ...(domain ? { domain } : {}),
  };
  try {
    const { data } = await api.post("/license/verify", payload);
    return data;
  } catch (error) {
    const response = error?.response;
    const message =
      response?.data?.message ||
      response?.data?.error ||
      error?.statusMessage ||
      error?.message ||
      "Unable to verify Envato purchase code.";
    const wrappedError = new Error(message);
    if (response?.status) {
      wrappedError.status = response.status;
    }
    if (response?.data) {
      wrappedError.data = response.data;
    }
    wrappedError.cause = error;
    throw wrappedError;
  }
}
