import axios from 'axios';

export default async function handler(req, res) {
  const { q = '' } = req.query;
  if (!q) {
    return res.status(200).json([]);
  }

  try {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
    const { data } = await axios.get(`${base}/search`, { params: { q } });
    const payload = data.data || data;
    const suggestions = Object.values(payload)
      .flat()
      .map((item) => item.title || item.full_name)
      .slice(0, 5);
    res.status(200).json(suggestions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
}
