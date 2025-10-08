import axios from 'axios';

export default async function handler(req, res) {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  const url = `${base}/policies`;
  try {
    const headers = req.headers.cookie ? { Cookie: req.headers.cookie } : {};
    if (req.method === 'GET') {
      const { data } = await axios.get(url, { headers, withCredentials: true });
      return res.status(200).json(data.data || data);
    }
    if (req.method === 'PUT') {
      const { data } = await axios.put(url, req.body, { headers, withCredentials: true });
      return res.status(200).json(data.data);
    }
    res.setHeader('Allow', ['GET', 'PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err) {
    const status = err.response?.status || 500;
    const message = err.response?.data?.message || 'Failed to process request';
    res.status(status).json({ error: message });
  }
}
