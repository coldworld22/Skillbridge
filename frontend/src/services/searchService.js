import api from '@/services/api/api';

export const searchAll = async (query, config = {}) => {
  const reqConfig = {
    ...config,
    params: { ...(config.params || {}), q: query },
  };
  const { data } = await api.get('search', reqConfig);
  // API may return `{status, message, data}` or the raw results object
  // Normalize by always returning the payload containing the lists
  return data.data || data;
};
