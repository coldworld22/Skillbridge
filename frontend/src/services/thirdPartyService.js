import api from '@/services/api/api';

export const fetchThirdPartyConfig = async () => {
  const { data } = await api.get('third-party-config');
  return data?.data ?? {};
};
