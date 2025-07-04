// pages/api/tutorials/[id]/analytics.js
import axios from 'axios';

export default async function handler(req, res) {
  const { id } = req.query;
  try {
    const { data } = await axios.get(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/tutorials/admin/${id}/analytics`,
      {
        headers: req.headers.cookie ? { Cookie: req.headers.cookie } : {},
        withCredentials: true,
      }
    );
    if (!data?.data) {
      return res.status(404).json({ error: 'Analytics not found' });
    }
    return res.status(200).json(data.data);
  } catch (err) {
    const status = err.response?.status || 500;
    const message = err.response?.data?.message || 'Failed to fetch analytics';
    return res.status(status).json({ error: message });
  }
}

