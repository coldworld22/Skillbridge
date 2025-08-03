import api from "@/services/api/api";

export const fetchInstructorBooks = async () => {
  const { data } = await api.get("/instructor/books");
  return data?.data || [];
};

export default { fetchInstructorBooks };
