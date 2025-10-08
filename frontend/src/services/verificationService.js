import api from "@/services/api/api";

export const sendEmailOtp = async () => {
  const res = await api.post("/verify/email/send");
  return res.data;
};

export const sendPhoneOtp = async () => {
  const res = await api.post("/verify/phone/send");
  return res.data;
};

export const confirmEmailOtp = async (code) => {
  const res = await api.post("/verify/email/confirm", { code });
  return res.data;
};

export const confirmPhoneOtp = async (code) => {
  const res = await api.post("/verify/phone/confirm", { code });
  return res.data;
};
