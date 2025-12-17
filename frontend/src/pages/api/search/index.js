import axios from 'axios';

export default async function handler(req, res) {
  const { q = '' } = req.query;
  const query = q.trim();
  if (!query) return res.status(400).json({ error: 'Missing query string' });
  try {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5002/api';
    const { data } = await axios.get(`${base}/search`, {
      params: { q: query },
      headers: req.headers.cookie ? { Cookie: req.headers.cookie } : {},
      withCredentials: true,
    });
    return res.status(200).json(data.data || data);
  } catch (err) {
    const status = err.response?.status || 500;
    const message = err.response?.data?.message || 'Search failed';
    res.status(status).json({ error: message });
  }
}
