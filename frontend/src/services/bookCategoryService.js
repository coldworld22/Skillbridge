import api from "@/services/api/api";

export const fetchBookCategories = async () => {
  const { data } = await api.get("/users/categories", {
    params: { status: "active", limit: 1000 },
  });
  return data?.data?.data ?? [];
};

export default { fetchBookCategories };
