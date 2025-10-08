import api from '@/services/api/api';

export const searchAll = async (query) => {
  const { data } = await api.get('/search', { params: { q: query } });
  // API may return `{status, message, data}` or the raw results object
  // Normalize by always returning the payload containing the lists
  return data.data || data;
};
