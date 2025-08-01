import api from '@/services/api/api';

export const searchAll = async (query) => {
  const { data } = await api.get('/search', { params: { q: query } });
  return data;
};
