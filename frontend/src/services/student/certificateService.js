import api from "@/services/api/api";

export const fetchCertificates = async () => {
  const { data } = await api.get("/users/student/certificates");
  return data?.data ?? [];
};

export const getCertificate = async (id) => {
  const { data } = await api.get(`/users/student/certificates/${id}`);
  return data?.data;
};
