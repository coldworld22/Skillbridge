import axios from 'axios';

import getApiBaseUrl from '@/pages/api/_utils/baseUrl';

export default async function handler(req, res) {
  const { classId, studentId } = req.query;

  try {
    const { data } = await axios.get(
      `${getApiBaseUrl()}/users/classes/admin/${classId}/students/${studentId}`
    );
    return res.status(200).json(data.data || data);
  } catch (err) {
    const status = err.response?.status || 500;
    const message = err.response?.data?.message || 'Failed to fetch student';
    res.status(status).json({ error: message });
  }
}
