import api from "@/services/api/api";

// Fetch books belonging to the current instructor with
// optional pagination, filtering and status parameters
export const fetchInstructorBooks = async ({
  page,
  perPage,
  filters = {},
  sort = {},
  status,
} = {}) => {
  const params = {
    ...(page !== undefined && { page }),
    ...(perPage !== undefined && { perPage }),
    ...filters,
    ...sort,
    ...(status ? { status } : {}),
  };

  const { data } = await api.get("/instructor/books", { params });
  const list = data?.data || [];
  return { books: list, meta: data?.meta ?? {} };
};

export default { fetchInstructorBooks };
