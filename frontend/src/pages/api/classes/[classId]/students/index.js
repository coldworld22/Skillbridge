import axios from 'axios';

import getApiBaseUrl from '@/pages/api/_utils/baseUrl';

export default async function handler(req, res) {
  const { classId } = req.query;
  const cookie = req.headers?.cookie;
  const axiosOptions = {
    withCredentials: true,
    headers: cookie ? { Cookie: cookie } : {},
  };
  try {
    const { data } = await axios.get(
      `${getApiBaseUrl()}/users/classes/admin/${classId}/students`
    );
    return res.status(200).json(data.data || data);
  } catch (err) {
    const status = err.response?.status || 500;
    const message = err.response?.data?.message || 'Failed to fetch students';
    res.status(status).json({ error: message });
  }
}
